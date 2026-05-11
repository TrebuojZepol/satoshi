"use client";

import { useEffect } from "react";
import { useWalletStore } from "@/stores/wallet-store";

const COOKIE = "bv_wallet";

export function WalletCookieSync() {
  const connected = useWalletStore((s) => s.connected);
  const address = useWalletStore((s) => s.address);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    if (connected && address) {
      document.cookie = `${COOKIE}=${encodeURIComponent(address)}; path=/; max-age=31536000; samesite=lax`;
    } else {
      document.cookie = `${COOKIE}=; path=/; max-age=0; samesite=lax`;
    }
  }, [connected, address]);

  return null;
}
