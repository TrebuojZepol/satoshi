"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_WALLET_BALANCE_SATS } from "@/lib/constants";

export type WalletProvider = "mock" | "unisat";

export type WalletState = {
  provider: WalletProvider;
  connected: boolean;
  address: string | null;
  label: string | null;
  balanceSats: bigint;
  connectMock: () => void;
  connectUnisat: () => Promise<void>;
  disconnect: () => void;
  signPsbtWithUnisat: (psbtBase64: string) => Promise<string>;
  pushPsbtWithUnisat: (signedPsbt: string) => Promise<string>;
};

const MOCK_ADDRESS =
  "tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";

function unisatBalanceToSats(
  bal: number | { confirmed: number; unconfirmed: number; total: number },
): bigint {
  if (typeof bal === "number") {
    return BigInt(Math.max(0, Math.floor(bal)));
  }
  return BigInt(Math.max(0, Math.floor(bal.total)));
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      provider: "mock",
      connected: false,
      address: null,
      label: null,
      balanceSats: 0n,
      connectMock: () =>
        set({
          provider: "mock",
          connected: true,
          address: MOCK_ADDRESS,
          label: "Mock testnet wallet",
          balanceSats: MOCK_WALLET_BALANCE_SATS,
        }),
      connectUnisat: async () => {
        if (typeof window === "undefined" || !window.unisat) {
          throw new Error("UniSat extension not detected");
        }
        const u = window.unisat;
        const accounts = await u.requestAccounts();
        const address = accounts[0];
        if (!address) {
          throw new Error("No UniSat account");
        }
        const bal = await u.getBalance();
        set({
          provider: "unisat",
          connected: true,
          address,
          label: "UniSat",
          balanceSats: unisatBalanceToSats(bal),
        });
      },
      disconnect: () =>
        set({
          provider: "mock",
          connected: false,
          address: null,
          label: null,
          balanceSats: 0n,
        }),
      signPsbtWithUnisat: async (psbtBase64) => {
        if (typeof window === "undefined" || !window.unisat) {
          throw new Error("UniSat not available");
        }
        return window.unisat.signPsbt(psbtBase64, { autoFinalized: false });
      },
      pushPsbtWithUnisat: async (signedPsbt) => {
        if (typeof window === "undefined" || !window.unisat) {
          throw new Error("UniSat not available");
        }
        return window.unisat.pushPsbt(signedPsbt);
      },
    }),
    {
      name: "bitvault-wallet",
      partialize: (s) => ({
        provider: s.provider,
        connected: s.connected,
        address: s.address,
        label: s.label,
        balanceSats: s.balanceSats.toString(),
      }),
      merge: (persisted, current) => {
        const p = persisted as Record<string, unknown> | undefined;
        if (!p) {
          return current;
        }
        const bal = p["balanceSats"];
        const prov = p["provider"];
        return {
          ...current,
          provider:
            prov === "unisat" || prov === "mock"
              ? (prov as WalletProvider)
              : "mock",
          connected: Boolean(p["connected"]),
          address: (p["address"] as string | null) ?? null,
          label: (p["label"] as string | null) ?? null,
          balanceSats:
            typeof bal === "string" || typeof bal === "number"
              ? BigInt(String(bal))
              : current.balanceSats,
        };
      },
    },
  ),
);
