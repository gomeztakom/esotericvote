"use client";

import { useState, useEffect, useMemo } from 'react';
import { Vote } from '../../hooks/useVoting';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { useVotingContext } from '../providers/VotingProvider';
import { useWallet } from '../providers/WalletProvider';
import { VotingContractAddresses } from '../../abi/VotingContractAddresses';
import { VotingContractABI } from '../../abi/VotingContractABI';
import { ethers } from 'ethers';

interface VoteCardProps {
  vote: Vote;
  onVoteCast?: () => void;
}

export function VoteCard({ vote, onVoteCast }: VoteCardProps) {
  const { castVote, getVoteResults, isLoading } = useVotingContext();
  const { address, signer, chainId } = useWallet();
  const [isEnding, setIsEnding] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [hasUserVoted, setHasUserVoted] = useState(false);
  const [voteResults, setVoteResults] = useState<number[] | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);

  const isActive = vote.isActive && Date.now() / 1000 >= vote.startTime && Date.now() / 1000 <= vote.endTime;
  const hasEnded = Date.now() / 1000 > vote.endTime;
  const notStarted = Date.now() / 1000 < vote.startTime;
  const isCreator = address && vote.creator.toLowerCase() === address.toLowerCase();

  // Check if user has voted
  const voteStatusKey = useMemo(() => `${address}-${vote.id}-${chainId}`, [address, vote.id, chainId]);

  useEffect(() => {
    const checkVoteStatus = async () => {
      if (!address || !signer || !chainId) return;

      try {
        const addressKey = VotingContractAddresses[chainId.toString() as keyof typeof VotingContractAddresses]?.address;

        if (!addressKey || addressKey === "0x0000000000000000000000000000000000000000") return;

        const contract = new ethers.Contract(addressKey, VotingContractABI.abi, signer);
        const hasVoted = await contract.hasUserVoted(vote.id, address);
        setHasUserVoted(hasVoted);
      } catch (error) {
        console.warn('Failed to check vote status:', error);
        // Keep default state (false)
      }
    };

    checkVoteStatus();
  }, [voteStatusKey, signer]);

  const handleVote = async () => {
    if (selectedOption === null) return;

    setIsVoting(true);
    try {
      await castVote(vote.id, selectedOption);
      onVoteCast?.();
    } catch (error) {
      console.error('Failed to cast vote:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleViewResults = async () => {
    setLoadingResults(true);
    try {
      const results = await getVoteResults(vote.id);
      setVoteResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Failed to get vote results:', error);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleEndVote = async () => {
    if (!signer || !chainId) return;

    setIsEnding(true);
    try {
      const addressKey = VotingContractAddresses[chainId.toString() as keyof typeof VotingContractAddresses]?.address;

      if (!addressKey || addressKey === "0x0000000000000000000000000000000000000000") return;

      const contract = new ethers.Contract(addressKey, VotingContractABI.abi, signer);
      const tx = await contract.endVote(vote.id);
      await tx.wait();

      // Refresh the vote data
      if (onVoteCast) onVoteCast();
    } catch (error) {
      console.error('Failed to end vote:', error);
    } finally {
      setIsEnding(false);
    }
  };

  const getStatusText = () => {
    if (notStarted) return 'Not Started';
    if (hasEnded) return 'Ended';
    return 'Active';
  };

  const getStatusColor = () => {
    if (notStarted) return 'text-yellow-600';
    if (hasEnded) return 'text-gray-600';
    return 'text-green-600';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{vote.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{vote.description}</p>
          </div>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-4">
            <span>Creator: {vote.creator.slice(0, 6)}...{vote.creator.slice(-4)}</span>
            <span>Total Votes: {vote.totalVotes}</span>
          </div>
          <div className="flex items-center gap-2">
            {hasUserVoted && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✅ Voted
              </span>
            )}
            {isCreator && isActive && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleEndVote}
                disabled={isEnding}
                isLoading={isEnding}
                className="text-xs"
              >
                {isEnding ? 'Ending...' : 'End Vote'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {showResults && voteResults ? (
          <div className="space-y-4">
            <h4 className="font-medium">Vote Results</h4>
            <div className="space-y-2">
              {vote.options.map((option, index) => {
                const votes = voteResults[index] || 0;
                const total = voteResults.reduce((sum, v) => sum + (v || 0), 0);
                const percentage = total > 0 ? (votes / total) * 100 : 0;

                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">{option}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-background rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${percentage}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-16 text-right">
                        {votes} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button
              variant="outline"
              onClick={() => setShowResults(false)}
              className="w-full"
            >
              Hide Results
            </Button>
          </div>
        ) : isActive && hasUserVoted ? (
          <div className="text-center py-6">
            <div className="text-green-600 text-lg mb-2">✅</div>
            <p className="text-muted-foreground">You have already voted in this poll</p>
          </div>
        ) : isActive && !hasUserVoted ? (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Select your option:</h4>
              <div className="space-y-2">
                {vote.options.map((option, index) => (
                  <label key={index} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`vote-${vote.id}`}
                      value={index}
                      checked={selectedOption === index}
                      onChange={() => setSelectedOption(index)}
                      className="text-primary"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button
              onClick={handleVote}
              disabled={selectedOption === null || isVoting || isLoading}
              className="w-full"
              isLoading={isVoting}
            >
              {isVoting ? 'Casting Vote...' : 'Cast Vote'}
            </Button>
          </div>
        ) : hasEnded || !vote.isActive ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-muted-foreground">
              {hasEnded ? 'Voting has ended' : 'Voting was ended early'}
            </p>
            <Button
              onClick={handleViewResults}
              disabled={loadingResults}
              isLoading={loadingResults}
              variant="outline"
            >
              {loadingResults ? 'Loading Results...' : 'View Results'}
            </Button>
          </div>
        ) : notStarted ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              Voting starts at {new Date(vote.startTime * 1000).toLocaleString()}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
