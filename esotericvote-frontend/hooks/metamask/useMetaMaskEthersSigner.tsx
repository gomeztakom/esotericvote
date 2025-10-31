"use client";

import { useEffect, useState } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { EIP6963ProviderDetail } from "./Eip6963Types";

export interface WalletState {
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

const initialState: WalletState = {
  provider: null,
  signer: null,
  address: null,
  chainId: null,
  isConnected: false,
  isConnecting: false,
  error: null,
};

export const useMetaMaskEthersSigner = (providerDetail: EIP6963ProviderDetail | null) => {
  const [state, setState] = useState<WalletState>(initialState);

  // Check persistent connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!providerDetail) return;

      try {
        const accounts = await providerDetail.provider.request({
          method: "eth_accounts",
        });

        if (accounts.length > 0) {
          await connect();
        }
      } catch (error) {
        console.warn("Failed to check persistent connection:", error);
      }
    };

    checkConnection();
  }, [providerDetail]);

  // Listen for account changes
  useEffect(() => {
    if (!providerDetail) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected
        disconnect();
      } else {
        // Account changed
        await updateSigner(accounts[0]);
      }
    };

    const handleChainChanged = async (chainId: string) => {
      const numericChainId = parseInt(chainId, 16);
      setState((prev) => ({ ...prev, chainId: numericChainId }));

      // Reconnect with new chain
      if (state.isConnected) {
        await connect();
      }
    };

    const handleDisconnect = () => {
      disconnect();
    };

    providerDetail.provider.on("accountsChanged", handleAccountsChanged);
    providerDetail.provider.on("chainChanged", handleChainChanged);
    providerDetail.provider.on("disconnect", handleDisconnect);

    return () => {
      providerDetail.provider.removeListener("accountsChanged", handleAccountsChanged);
      providerDetail.provider.removeListener("chainChanged", handleChainChanged);
      providerDetail.provider.removeListener("disconnect", handleDisconnect);
    };
  }, [providerDetail, state.isConnected]);

  const connect = async () => {
    if (!providerDetail) {
      setState((prev) => ({ ...prev, error: "No provider available" }));
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Request accounts
      await providerDetail.provider.request({
        method: "eth_requestAccounts",
      });

      // Get current accounts
      const accounts = await providerDetail.provider.request({
        method: "eth_accounts",
      });

      if (accounts.length === 0) {
        throw new Error("No accounts available");
      }

      const address = accounts[0];
      await updateSigner(address);
    } catch (error) {
      console.error("Failed to connect:", error);
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : "Failed to connect",
      }));
    }
  };

  const disconnect = () => {
    setState(initialState);
  };

  const updateSigner = async (address: string) => {
    if (!providerDetail) return;

    try {
      const ethersProvider = new BrowserProvider(providerDetail.provider);
      const signer = await ethersProvider.getSigner();
      const network = await ethersProvider.getNetwork();
      const chainId = Number(network.chainId);

      setState((prev) => ({
        ...prev,
        provider: ethersProvider,
        signer,
        address,
        chainId,
        isConnected: true,
        isConnecting: false,
        error: null,
      }));

      // Persist connection
      localStorage.setItem("wallet.connected", "true");
      localStorage.setItem("wallet.lastConnectorId", providerDetail.info.uuid);
      localStorage.setItem("wallet.lastAccounts", JSON.stringify([address]));
      localStorage.setItem("wallet.lastChainId", chainId.toString());
    } catch (error) {
      console.error("Failed to update signer:", error);
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : "Failed to get signer",
      }));
    }
  };

  return {
    ...state,
    connect,
    disconnect,
  };
};

