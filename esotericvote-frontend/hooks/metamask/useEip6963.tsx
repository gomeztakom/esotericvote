"use client";

import { useEffect, useState } from "react";
import { EIP6963ProviderDetail, EIP6963AnnounceProviderEvent } from "./Eip6963Types";

export const useEip6963 = () => {
  const [providers, setProviders] = useState<EIP6963ProviderDetail[]>([]);

  useEffect(() => {
    const onAnnounceProvider = (event: EIP6963AnnounceProviderEvent) => {
      setProviders((prevProviders) => {
        const exists = prevProviders.some(
          (provider) => provider.info.uuid === event.detail.info.uuid
        );
        if (exists) return prevProviders;
        return [...prevProviders, event.detail];
      });
    };

    // Listen for providers being announced
    window.addEventListener(
      "eip6963:announceProvider",
      onAnnounceProvider as EventListener
    );

    // Request providers
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => {
      window.removeEventListener(
        "eip6963:announceProvider",
        onAnnounceProvider as EventListener
      );
    };
  }, []);

  return providers;
};

