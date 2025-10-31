"use client";

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useWallet } from './WalletProvider';
import { useFhevm } from '../../hooks/useFhevm';
import { FhevmState } from '../../hooks/useFhevm';

interface FhevmContextType extends FhevmState {
  createInstance: () => Promise<(() => void) | undefined>;
}

const FhevmContext = createContext<FhevmContextType | null>(null);

export const useFhevmContext = () => {
  const context = useContext(FhevmContext);
  if (!context) {
    throw new Error('useFhevmContext must be used within a FhevmProvider');
  }
  return context;
};

interface FhevmProviderProps {
  children: ReactNode;
}

export function FhevmProvider({ children }: FhevmProviderProps) {
  const walletState = useWallet();

  const fhevmState = useFhevm(walletState);

  const contextValue = useMemo(() => ({
    ...fhevmState,
  }), [fhevmState]);

  return (
    <FhevmContext.Provider value={contextValue}>
      {children}
    </FhevmContext.Provider>
  );
}
