"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createFhevmInstance, FhevmAbortError } from "../fhevm/fhevm";
import { FhevmInstance } from "../fhevm/fhevmTypes";
import { WalletState } from "./metamask/useMetaMaskEthersSigner";

export interface FhevmState {
  instance: FhevmInstance | null;
  isLoading: boolean;
  error: string | null;
  status: string;
}

const initialState: FhevmState = {
  instance: null,
  isLoading: false,
  error: null,
  status: "idle",
};

export const useFhevm = (walletState: WalletState) => {
  const [state, setState] = useState<FhevmState>(initialState);
  const hasAttemptedCreation = useRef(false);

  const createInstance = useCallback(async () => {
    if (!walletState.provider || !walletState.signer) {
      setState((prev) => ({
        ...prev,
        instance: null,
        error: "Wallet not connected",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const abortController = new AbortController();

    try {
      // For FHEVM instance creation, we need to pass a URL or EIP-1193 provider
      let providerOrUrl: string | any;

      if (walletState.chainId === 31337) {
        // For local development, use localhost URL
        providerOrUrl = "http://localhost:8545";
      } else {
        // For testnet, use the raw EIP-1193 provider
        providerOrUrl = (walletState as any).eip1193Provider;
        if (!providerOrUrl) {
          throw new Error("EIP-1193 provider not available for testnet");
        }
      }

      const instance = await createFhevmInstance({
        provider: providerOrUrl,
        signal: abortController.signal,
        onStatusChange: (status) => {
          setState((prev) => ({ ...prev, status }));
        },
      });

      setState((prev) => ({
        ...prev,
        instance,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      if (error instanceof FhevmAbortError) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Operation cancelled",
        }));
      } else {
        console.error("Failed to create FHEVM instance:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to create FHEVM instance",
        }));
      }
    }

    return () => abortController.abort();
  }, [walletState.provider, walletState.signer]);

  // Auto-create instance when wallet connects
  useEffect(() => {
    console.log("useFhevm useEffect triggered:", {
      isConnected: walletState.isConnected,
      hasInstance: !!state.instance,
      isLoading: state.isLoading,
      chainId: walletState.chainId,
      hasAttempted: hasAttemptedCreation.current
    });

    if (walletState.isConnected && !state.instance && !state.isLoading && !hasAttemptedCreation.current) {
      console.log("Creating FHEVM instance...");
      hasAttemptedCreation.current = true;
      // Create FHEVM instance for both local and testnet (needed for FHE decryption)
      createInstance();
    } else {
      console.log("Skipping FHEVM instance creation:", {
        isConnected: walletState.isConnected,
        hasInstance: !!state.instance,
        isLoading: state.isLoading,
        hasAttempted: hasAttemptedCreation.current
      });
    }
  }, [walletState.isConnected, walletState.chainId]); // Only depend on wallet state

  // Reset instance when wallet disconnects
  useEffect(() => {
    if (!walletState.isConnected) {
      setState(initialState);
      hasAttemptedCreation.current = false; // Reset creation attempt flag
    }
  }, [walletState.isConnected]);

  // Reset creation flag and state when wallet disconnects or chain changes
  useEffect(() => {
    if (!walletState.isConnected || !walletState.chainId) {
      setState(initialState);
      hasAttemptedCreation.current = false;
    } else if (walletState.isConnected && walletState.chainId && !hasAttemptedCreation.current) {
      // Try to create instance when wallet is connected and we haven't tried yet
      if (!state.instance && !state.isLoading) {
        console.log("Creating FHEVM instance for chain:", walletState.chainId);
        hasAttemptedCreation.current = true;
        createInstance();
      }
    }
  }, [walletState.isConnected, walletState.chainId]);

  return useMemo(() => ({
    ...state,
    createInstance,
  }), [state, createInstance]);
};
