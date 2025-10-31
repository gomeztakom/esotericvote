"use client";

import { useEffect, useState } from "react";
import { EIP6963ProviderDetail } from "./Eip6963Types";

export const useMetaMaskProvider = () => {
  const [metaMaskProvider, setMetaMaskProvider] = useState<EIP6963ProviderDetail | null>(null);

  useEffect(() => {
    const findMetaMask = () => {
      // Check if MetaMask is available via window.ethereum
      if ((window as any).ethereum?.isMetaMask) {
        setMetaMaskProvider({
          info: {
            uuid: "metamask",
            name: "MetaMask",
            icon: "", // MetaMask doesn't provide icon via EIP-6963
            rdns: "io.metamask",
          },
          provider: (window as any).ethereum,
        });
        return;
      }

      // Fallback: check for legacy MetaMask
      const legacyMetaMask = (window as any).ethereum?.providers?.find(
        (p: any) => p.isMetaMask
      );
      if (legacyMetaMask) {
        setMetaMaskProvider({
          info: {
            uuid: "metamask-legacy",
            name: "MetaMask (Legacy)",
            icon: "",
            rdns: "io.metamask",
          },
          provider: legacyMetaMask,
        });
      }
    };

    findMetaMask();
  }, []);

  return metaMaskProvider;
};

