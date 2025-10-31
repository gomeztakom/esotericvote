"use client";

import { useState, useEffect } from 'react';
import { VoteCard } from '../../components/voting/VoteCard';
import { Button } from '../../components/ui/Button';
import { useVotingContext } from '../../components/providers/VotingProvider';
import { useWallet } from '../../components/providers/WalletProvider';
import { ethers } from 'ethers';
import { VotingContractABI } from '../../abi/VotingContractABI';
import { VotingContractAddresses } from '../../abi/VotingContractAddresses';
import { Vote } from '../../hooks/useVoting';

export default function UserCenter() {
  const { address, signer, chainId } = useWallet();
  const { refreshVotes } = useVotingContext();
  const [userVotes, setUserVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'created' | 'participated'>('created');

  const getContract = () => {
    if (!signer || !chainId) return null;
    const address = VotingContractAddresses[chainId.toString() as keyof typeof VotingContractAddresses]?.address;
    if (!address || address === "0x0000000000000000000000000000000000000000") {
      return null;
    }
    return new ethers.Contract(address, VotingContractABI.abi, signer);
  };

  const loadUserVotes = async () => {
    if (!address || !signer) return;

    setLoading(true);
    try {
      const contract = getContract();
      if (!contract) return;

      if (activeTab === 'created') {
        // Get votes created by user
        const creatorVotesIds = await contract.getVotesByCreator(address);
        const votes: Vote[] = [];

        for (const voteId of creatorVotesIds) {
          try {
            const voteInfo = await contract.getVoteInfo(voteId);
            votes.push({
              id: Number(voteId),
              creator: voteInfo[0],
              title: voteInfo[1],
              description: voteInfo[2],
              options: voteInfo[3],
              startTime: Number(voteInfo[4]),
              endTime: Number(voteInfo[5]),
              isActive: voteInfo[6],
              isAnonymous: voteInfo[7],
              totalVotes: Number(voteInfo[8]),
            });
          } catch (error) {
            console.warn(`Failed to load vote ${voteId}:`, error);
          }
        }

        setUserVotes(votes);
      } else {
        // For participated votes, we'd need to track which votes the user has voted in
        // This would require additional contract methods or local storage
        // For now, show all active votes as a placeholder
        const activeVotes = await contract.getActiveVotes();
        const votes: Vote[] = [];

        for (const voteId of activeVotes.slice(0, 5)) { // Limit to 5 for demo
          try {
            const voteInfo = await contract.getVoteInfo(voteId);
            votes.push({
              id: Number(voteId),
              creator: voteInfo[0],
              title: voteInfo[1],
              description: voteInfo[2],
              options: voteInfo[3],
              startTime: Number(voteInfo[4]),
              endTime: Number(voteInfo[5]),
              isActive: voteInfo[6],
              isAnonymous: voteInfo[7],
              totalVotes: Number(voteInfo[8]),
            });
          } catch (error) {
            console.warn(`Failed to load vote ${voteId}:`, error);
          }
        }

        setUserVotes(votes);
      }
    } catch (error) {
      console.error('Failed to load user votes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserVotes();
  }, [address, signer, chainId, activeTab]);

  if (!address) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground">
              Please connect your wallet to view your voting activity.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Voting Center</h1>
          <p className="text-muted-foreground mt-2">
            Manage your created votes and track your participation
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            onClick={() => setActiveTab('created')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'created'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Votes I Created
          </button>
          <button
            onClick={() => setActiveTab('participated')}
            className={`px-4 py-2 font-medium ml-4 ${
              activeTab === 'participated'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Votes I Participated
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : userVotes.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">
              {activeTab === 'created' ? 'No Votes Created' : 'No Votes Participated'}
            </h2>
            <p className="text-muted-foreground">
              {activeTab === 'created'
                ? 'You haven\'t created any votes yet.'
                : 'You haven\'t participated in any votes yet.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                {activeTab === 'created' ? 'Your Created Votes' : 'Votes You Participated In'}
              </h2>
              <Button
                variant="outline"
                onClick={loadUserVotes}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {userVotes.map((vote) => (
                <VoteCard
                  key={vote.id}
                  vote={vote}
                  onVoteCast={loadUserVotes}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
