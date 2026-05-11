"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-slate-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <span className="text-lg font-semibold text-accent" data-testid="landing-logo">
          BitVault
        </span>
        <div className="flex gap-2">
          <Button asChild variant="ghost">
            <Link href="/dashboard" data-testid="landing-launch-app">
              Launch app
            </Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl space-y-6"
        >
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
            Bitcoin-native DeFi
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Borrow, swap, and earn with DLC-backed vaults and batched execution.
          </h1>
          <p className="text-lg text-muted-foreground">
            This deployment is a fully mocked interface and API for product review:
            no real keys, no chain writes, deterministic economics driven by SQLite
            and server-side simulators.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/dashboard" data-testid="landing-cta-primary">
                Open dashboard
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/dashboard/swap" data-testid="landing-cta-swap">
                Try batch swap
              </Link>
            </Button>
          </div>
        </motion.div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Batch auctions",
              body: "Uniform clearing price per Bitcoin block with transparent matching.",
            },
            {
              title: "DLC vaults",
              body: "Discreet Log Contracts simulate borrow, repay, and liquidation flows.",
            },
            {
              title: "sUSD & pools",
              body: "Stablecoin metrics, rate levers, and LP staking with mock TVL.",
            },
          ].map((c) => (
            <Card key={c.title} data-testid={`landing-card-${c.title.toLowerCase().replace(/\s+/g, "-")}`}>
              <CardHeader>
                <CardTitle className="text-base text-accent">{c.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{c.body}</CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
