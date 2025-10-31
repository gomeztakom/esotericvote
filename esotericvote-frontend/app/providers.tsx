'use client';

import { ReactNode } from 'react';
import { WalletProvider } from '../components/providers/WalletProvider';
import { FhevmProvider } from '../components/providers/FhevmProvider';
import { VotingProvider } from '../components/providers/VotingProvider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WalletProvider>
      <FhevmProvider>
        <VotingProvider>
          {children}
        </VotingProvider>
      </FhevmProvider>
    </WalletProvider>
  );
}
