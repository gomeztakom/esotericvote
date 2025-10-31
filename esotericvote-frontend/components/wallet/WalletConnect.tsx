"use client";

import { useState } from 'react';
import { useWallet } from '../providers/WalletProvider';
import { Button } from '../ui/Button';

export function WalletConnect() {
  const {
    isConnected,
    address,
    chainId,
    isConnecting,
    error,
    connect,
    disconnect
  } = useWallet();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 1: return 'Ethereum';
      case 11155111: return 'Sepolia';
      case 31337: return 'Hardhat';
      default: return `Chain ${chainId}`;
    }
  };

  if (isConnected && address) {
    return (
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          {formatAddress(address)}
          <span className="text-xs text-muted-foreground">
            ({getChainName(chainId!)})
          </span>
        </Button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-background border rounded-md shadow-lg z-10">
            <div className="p-3 border-b">
              <p className="text-sm font-medium">Connected Wallet</p>
              <p className="text-xs text-muted-foreground mt-1">
                {address}
              </p>
            </div>
            <button
              onClick={() => {
                disconnect();
                setIsDropdownOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={connect}
        disabled={isConnecting}
        isLoading={isConnecting}
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  );
}

