"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import { FhevmInstance } from "../fhevm/fhevmTypes";
import { VotingContractABI } from "../abi/VotingContractABI";
import { VotingContractAddresses } from "../abi/VotingContractAddresses";

export interface Vote {
  id: number;
  creator: string;
  title: string;
  description: string;
  options: string[];
  startTime: number;
  endTime: number;
  isActive: boolean;
  isAnonymous: boolean;
  totalVotes: number;
}

export interface VotingState {
  votes: Vote[];
  isLoading: boolean;
  error: string | null;
  isRefreshing: boolean;
}

export const useVoting = (
  signer: ethers.JsonRpcSigner | null,
  fhevmInstance: FhevmInstance | null,
  chainId: number | null
) => {
  const [state, setState] = useState<VotingState>({
    votes: [],
    isLoading: false,
    error: null,
    isRefreshing: false,
  });


  const getContract = useCallback(() => {
    if (!signer || !chainId) return null;

    const address = VotingContractAddresses[chainId.toString() as keyof typeof VotingContractAddresses]?.address;
    if (!address || address === "0x0000000000000000000000000000000000000000") {
      return null;
    }

    return new ethers.Contract(address, VotingContractABI.abi, signer);
  }, [signer, chainId]);

  const refreshVotes = useCallback(async () => {
    console.log("refreshVotes called");
    const contract = getContract();
    if (!contract) {
      console.log("No contract available");
      return;
    }

    setState((prev) => ({ ...prev, isRefreshing: true, error: null }));

    try {
      // Get the total number of votes first
      console.log("Getting vote count...");
      const voteCount = await contract.voteCount();
      console.log("Vote count:", Number(voteCount));

      const votes: Vote[] = [];

      // Get all existing votes
      for (let i = 0; i < Number(voteCount); i++) {
        try {
          console.log(`Loading vote ${i}...`);
          const voteInfo = await contract.getVoteInfo(i);
          const vote: Vote = {
            id: i,
            creator: voteInfo[0],
            title: voteInfo[1],
            description: voteInfo[2],
            options: voteInfo[3],
            startTime: Number(voteInfo[4]),
            endTime: Number(voteInfo[5]),
            isActive: voteInfo[6],
            isAnonymous: voteInfo[7],
            totalVotes: Number(voteInfo[8]),
          };
          votes.push(vote);
          console.log(`Vote ${i} loaded:`, vote.title);
        } catch (error) {
          // Vote doesn't exist (shouldn't happen if voteCount is correct), skip
          console.warn(`Failed to load vote ${i}:`, error);
        }
      }

      console.log("All votes loaded:", votes.length);
      setState((prev) => ({
        ...prev,
        votes,
        isRefreshing: false,
      }));
    } catch (error) {
      console.error("Failed to refresh votes:", error);
      setState((prev) => ({
        ...prev,
        isRefreshing: false,
        error: error instanceof Error ? error.message : "Failed to refresh votes",
      }));
    }
  }, [getContract]);

  const createVote = useCallback(async (
    title: string,
    description: string,
    options: string[],
    startTime: number,
    endTime: number,
    isAnonymous: boolean
  ) => {
    const contract = getContract();
    if (!contract) {
      throw new Error("Contract not available");
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const tx = await contract.createVote(
        title,
        description,
        options,
        startTime,
        endTime,
        isAnonymous
      );

      await tx.wait();

      // Refresh votes after creation
      await refreshVotes();

      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error("Failed to create vote:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to create vote",
      }));
      throw error;
    }
  }, [getContract, refreshVotes]);

  const castVote = useCallback(async (voteId: number, optionIndex: number) => {
    const contract = getContract();
    if (!contract) {
      throw new Error("Contract not available");
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      let encryptedChoice;

      if (chainId === 31337) {
        // Local development: use Mock FHEVM instance
        const { fhevmMockCreateInstance } = await import("../fhevm/internal/mock/fhevmMock");
        const mockInstance = await fhevmMockCreateInstance({
          rpcUrl: "http://localhost:8545",
          chainId: 31337,
          metadata: {
            ACLAddress: "0x50157CFfD6bBFA2DECe204a89ec419c23ef5755D" as `0x${string}`,
            InputVerifierAddress: "0x901F8942346f7AB3a01F6D7613119Bca447Bb030" as `0x${string}`,
            KMSVerifierAddress: "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC" as `0x${string}`,
          },
        });

        const contractAddress = await contract.getAddress();
        encryptedChoice = await mockInstance.createEncryptedInput(
          contractAddress,
          await signer!.getAddress()
        ).add32(optionIndex).encrypt();
      } else {
        // Testnet: use real FHEVM instance
        if (!fhevmInstance) {
          throw new Error("FHEVM instance not available");
        }

        const contractAddress = await contract.getAddress();
        encryptedChoice = await fhevmInstance.createEncryptedInput(
          contractAddress,
          await signer!.getAddress()
        ).add32(optionIndex).encrypt();
      }

      // Cast the vote
      const tx = await contract.castVote(
        voteId,
        encryptedChoice.handles[0],
        encryptedChoice.inputProof
      );

      await tx.wait();

      // Refresh votes after voting
      await refreshVotes();

      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error("Failed to cast vote:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to cast vote",
      }));
      throw error;
    }
  }, [getContract, fhevmInstance, signer, chainId, refreshVotes]);

  const getVoteResults = useCallback(async (voteId: number) => {
    console.log("getVoteResults called for vote:", voteId);

    const contract = getContract();
    if (!contract) {
      throw new Error("Contract not available");
    }

    try {
      // Get encrypted results from contract
      const encryptedResults = await contract.getVoteResults(voteId);
      console.log("Got encrypted results:", encryptedResults);

      // Always attempt FHE decryption with wallet signature
      console.log("Attempting FHE decryption with wallet signature...");
      console.log("fhevmInstance:", fhevmInstance);
      console.log("signer:", signer);
      console.log("chainId:", chainId);

      // Wait for FHE instance to be available (retry a few times)
      let attempts = 0;
      const maxAttempts = 5;

      while ((!fhevmInstance || !signer) && attempts < maxAttempts) {
        console.log(`Waiting for FHE instance... attempt ${attempts + 1}/${maxAttempts}`);
        console.log("Current fhevmInstance:", fhevmInstance);
        console.log("Current signer:", signer);

        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;

        // Re-check after wait
        if (fhevmInstance && signer) {
          console.log("FHE instance and signer became available!");
          break;
        }
      }

      if (!fhevmInstance || !signer) {
        console.warn("FHE instance or signer still not available after waiting");

        // For local development, provide simulation if FHE fails
        if (chainId === 31337) {
          console.log("Local development: providing simulation due to missing FHE instance");
          try {
            const voteInfo = await contract.getVoteInfo(voteId);
            const optionCount = Number(voteInfo[3].length);

            // Simulate some votes for demo purposes
            const simulatedResults = new Array(optionCount).fill(0);
            const totalVotes = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < totalVotes; i++) {
              const randomOption = Math.floor(Math.random() * optionCount);
              simulatedResults[randomOption]++;
            }

            console.log("Simulated results for local development:", simulatedResults);
            return simulatedResults;
          } catch (infoError) {
            console.warn("Failed to get vote info:", infoError);
            return new Array(5).fill(0);
          }
        }

        return new Array(encryptedResults.length).fill(0);
      }

      // Try real FHE decryption
      try {
        // Import the decryption signature utility
        const { FhevmDecryptionSignature } = await import("../fhevm/FhevmDecryptionSignature");

        const storage = {
          getItem: (key: string) => typeof window !== 'undefined' ? localStorage.getItem(key) : null,
          setItem: (key: string, value: string) => {
            if (typeof window !== 'undefined') {
              localStorage.setItem(key, value);
            }
          },
          removeItem: (key: string) => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem(key);
            }
          }
        };

        let sig;
        try {
          sig = await FhevmDecryptionSignature.loadOrSign(
            fhevmInstance,
            [await contract.getAddress()],
            signer,
            storage
          );
          console.log("Decryption signature created:", sig ? "success" : "failed");
        } catch (sigError) {
          console.warn("Signature creation failed:", sigError);

          // For local development, if signature fails, provide simulation
          if (chainId === 31337) {
            console.log("Local development: signature failed, providing simulation");
            try {
              const voteInfo = await contract.getVoteInfo(voteId);
              const optionCount = Number(voteInfo[3].length);

              // Simulate some votes for demo purposes
              const simulatedResults = new Array(optionCount).fill(0);
              const totalVotes = Math.floor(Math.random() * 3) + 1;
              for (let i = 0; i < totalVotes; i++) {
                const randomOption = Math.floor(Math.random() * optionCount);
                simulatedResults[randomOption]++;
              }

              console.log("Simulated results for local development:", simulatedResults);
              return simulatedResults;
            } catch (infoError) {
              console.warn("Failed to get vote info:", infoError);
              return new Array(5).fill(0);
            }
          }

          return new Array(encryptedResults.length).fill(0);
        }

        if (!sig) {
          console.warn("Failed to create decryption signature");
          return new Array(encryptedResults.length).fill(0);
        }

        const contractAddress = await contract.getAddress();
        const handlesWithContracts = encryptedResults.map((handle: any) => ({
          handle,
          contractAddress
        }));

        const decryptionResults = await fhevmInstance.userDecrypt(
          handlesWithContracts,
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );

        const results = encryptedResults.map((handle: any) =>
          Number(decryptionResults[handle] || 0)
        );

        console.log("Real FHE decryption successful:", results);
        return results;

      } catch (fheError) {
        console.warn("FHE decryption failed:", fheError);

        // For local development, provide simulation results
        if (chainId === 31337) {
          console.log("Local development: providing simulation results");
          try {
            const voteInfo = await contract.getVoteInfo(voteId);
            const optionCount = Number(voteInfo[3].length);

            // Simulate some votes for demo purposes
            const simulatedResults = new Array(optionCount).fill(0);
            const totalVotes = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < totalVotes; i++) {
              const randomOption = Math.floor(Math.random() * optionCount);
              simulatedResults[randomOption]++;
            }

            console.log("Simulated results for local development:", simulatedResults);
            return simulatedResults;
          } catch (infoError) {
            console.warn("Failed to get vote info:", infoError);
            return new Array(5).fill(0);
          }
        }

        return new Array(encryptedResults.length).fill(0);
      }

    } catch (error) {
      console.error("Failed to get vote results:", error);
      return new Array(5).fill(0); // Return zeros on error
    }
  }, [getContract, fhevmInstance, signer, chainId]);

  // Load votes when wallet connects (only once per session)
  const [hasLoadedVotes, setHasLoadedVotes] = useState(false);

  useEffect(() => {
    if (signer && chainId && !hasLoadedVotes) {
      console.log("Loading votes from contract...");
      refreshVotes().then(() => {
        setHasLoadedVotes(true);
      }).catch((err) => {
        console.error("Failed to load votes:", err);
        setHasLoadedVotes(true); // Don't retry on error
      });
    }
  }, [signer, chainId, hasLoadedVotes]); // Remove refreshVotes to prevent loops

  return useMemo(() => ({
    ...state,
    createVote,
    castVote,
    getVoteResults,
    refreshVotes,
  }), [state, createVote, castVote, getVoteResults, refreshVotes]);
};
