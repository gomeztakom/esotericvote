"use client";

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useMetaMaskProvider } from '../../hooks/metamask/useMetaMaskProvider';
import { useMetaMaskEthersSigner } from '../../hooks/metamask/useMetaMaskEthersSigner';
import { WalletState } from '../../hooks/metamask/useMetaMaskEthersSigner';

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  eip1193Provider: any; // Raw EIP-1193 provider
}

const WalletContext = createContext<WalletContextType | null>(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const metaMaskProvider = useMetaMaskProvider();
  const walletState = useMetaMaskEthersSigner(metaMaskProvider);

  const contextValue = useMemo(() => ({
    ...walletState,
    eip1193Provider: metaMaskProvider?.provider || null, // Expose the raw EIP-1193 provider
  }), [walletState, metaMaskProvider]);

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}
