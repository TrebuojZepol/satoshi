"use client";

import Link from "next/link";
import { BlockCountdown } from "@/components/bitcoin/BlockCountdown";
import { WalletButton } from "@/components/wallet/wallet-button";

export function Header() {
  return (
    <header
      className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-background/80 px-4 py-3 backdrop-blur"
      data-testid="dashboard-header"
    >
      <div className="flex min-w-0 flex-1 items-center gap-6">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground lg:hidden">
          ← Home
        </Link>
        <BlockCountdown />
      </div>
      <WalletButton />
    </header>
  );
}
