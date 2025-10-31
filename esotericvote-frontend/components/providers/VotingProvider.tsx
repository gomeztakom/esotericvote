"use client";

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useWallet } from './WalletProvider';
import { useFhevmContext } from './FhevmProvider';
import { useVoting } from '../../hooks/useVoting';

interface VotingContextType {
  votes: any[];
  isLoading: boolean;
  error: string | null;
  isRefreshing: boolean;
  createVote: (title: string, description: string, options: string[], startTime: number, endTime: number, isAnonymous: boolean) => Promise<void>;
  castVote: (voteId: number, optionIndex: number) => Promise<void>;
  getVoteResults: (voteId: number) => Promise<number[]>;
  refreshVotes: () => Promise<void>;
}

const VotingContext = createContext<VotingContextType | null>(null);

export const useVotingContext = () => {
  const context = useContext(VotingContext);
  if (!context) {
    throw new Error('useVotingContext must be used within a VotingProvider');
  }
  return context;
};

interface VotingProviderProps {
  children: ReactNode;
}

export function VotingProvider({ children }: VotingProviderProps) {
  const walletState = useWallet();
  const fhevmState = useFhevmContext();

  const votingState = useVoting(
    walletState.signer,
    fhevmState.instance,
    walletState.chainId
  );

  const contextValue = useMemo(() => ({
    ...votingState,
  }), [votingState]);

  return (
    <VotingContext.Provider value={contextValue}>
      {children}
    </VotingContext.Provider>
  );
}
