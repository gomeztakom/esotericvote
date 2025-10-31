"use client";

import { useState, useEffect } from 'react';
import { VoteCard } from '../components/voting/VoteCard';
import { CreateVoteModal } from '../components/voting/CreateVoteModal';
import { Button } from '../components/ui/Button';
import { useVotingContext } from '../components/providers/VotingProvider';
import { useWallet } from '../components/providers/WalletProvider';
import { useFhevmContext } from '../components/providers/FhevmProvider';

export default function Home() {
  const { isConnected } = useWallet();
  const { votes, isLoading: votesLoading, error, refreshVotes } = useVotingContext();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // useVoting hook already loads votes when wallet connects

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Welcome to EsotericVote</h1>
            <p className="text-muted-foreground mt-2">
              Privacy-preserving voting system built on FHEVM
            </p>
          </div>

          <div className="flex items-center gap-4">
            {isConnected && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                Create Vote
              </Button>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {!isConnected && (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground">
              Connect your wallet to start voting and creating encrypted votes.
            </p>
          </div>
        )}

        {isConnected && votes.length === 0 && !votesLoading && (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">No Votes Yet</h2>
            <p className="text-muted-foreground mb-4">
              Be the first to create a vote or wait for others to create one.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Votes Grid */}
        {isConnected && votes.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Active Votes</h2>
              <Button
                variant="outline"
                onClick={() => refreshVotes()}
                disabled={votesLoading}
                isLoading={votesLoading}
              >
                Refresh
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {votes.map((vote) => (
                <VoteCard
                  key={vote.id}
                  vote={vote}
                  onVoteCast={() => refreshVotes()}
                />
              ))}
            </div>
          </div>
        )}

        {/* Create Vote Modal */}
        <CreateVoteModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onVoteCreated={() => refreshVotes()}
        />
      </div>
    </main>
  );
}
