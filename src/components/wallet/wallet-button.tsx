"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatSatsToBtc8 } from "@/lib/money";
import { useWalletStore } from "@/stores/wallet-store";

export function WalletButton() {
  const {
    connected,
    address,
    label,
    balanceSats,
    provider,
    connectMock,
    connectUnisat,
    disconnect,
  } = useWalletStore();
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [hasUnisat, setHasUnisat] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setHasUnisat(typeof window !== "undefined" && Boolean(window.unisat));
  }, []);

  if (!hydrated) {
    return (
      <Button type="button" variant="secondary" disabled data-testid="wallet-hydrating">
        Wallet…
      </Button>
    );
  }

  async function onConnectMock() {
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      connectMock();
      toast.success("Mock wallet connected");
    } catch {
      toast.error("Could not connect");
    } finally {
      setBusy(false);
    }
  }

  async function onConnectUnisat() {
    setBusy(true);
    try {
      await connectUnisat();
      toast.success("UniSat connected");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "UniSat connect failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDisconnect() {
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 150));
      disconnect();
      toast.message("Disconnected");
    } finally {
      setBusy(false);
    }
  }

  if (!connected) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2" data-testid="wallet-disconnected">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void onConnectMock()}
          disabled={busy}
          data-testid="wallet-connect-mock"
        >
          {busy ? "…" : "Mock wallet"}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => void onConnectUnisat()}
          disabled={busy || !hasUnisat}
          title={hasUnisat ? "Connect UniSat" : "Install https://unisat.io/download"}
          data-testid="wallet-connect-unisat"
        >
          {busy ? "…" : "UniSat"}
        </Button>
      </div>
    );
  }

  return (
    <div
      className="flex max-w-full flex-col items-end gap-1 text-right sm:flex-row sm:items-center sm:gap-3"
      data-testid="wallet-connected"
    >
      <div className="min-w-0">
        <p className="truncate font-data text-xs text-muted-foreground" data-testid="wallet-address">
          {address}
        </p>
        <p className="text-xs text-muted-foreground">
          {label}
          {provider === "unisat" ? (
            <span className="ml-1 text-accent" data-testid="wallet-provider-unisat">
              (live)
            </span>
          ) : null}
        </p>
      </div>
      <div className="font-data text-sm" data-testid="wallet-balance">
        {formatSatsToBtc8(balanceSats)} BTC
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => void onDisconnect()}
        disabled={busy}
        data-testid="wallet-disconnect"
      >
        {busy ? "…" : "Disconnect"}
      </Button>
    </div>
  );
}
