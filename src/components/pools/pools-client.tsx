"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatSatsToBtc8, formatUsd2, parseUsdDecimalToCents } from "@/lib/money";

type Pool = {
  id: string;
  pair: string;
  tvlUsdCents: string;
  aprBps: string;
  reserveSusdCents: string;
  reserveSats: string;
};

type Stake = {
  id: string;
  poolId: string;
  stakedSusdCents: string;
  rewardsSusdCents: string;
  updatedAt: string;
};

export function PoolsClient() {
  const qc = useQueryClient();
  const [amount, setAmount] = useState("1000.00");
  const [err, setErr] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["pools"],
    queryFn: async () => {
      const res = await fetch("/api/pools");
      if (!res.ok) {
        throw new Error("Failed to load pools");
      }
      return (await res.json()) as { pools: Pool[]; stakes: Stake[] };
    },
  });

  const stake = useMutation({
    mutationFn: async (poolId: string) => {
      let cents: bigint;
      try {
        cents = parseUsdDecimalToCents(amount);
      } catch {
        throw new Error("Invalid stake amount");
      }
      const res = await fetch("/api/pools/stake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poolId,
          amountSusdCents: cents.toString(),
        }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "Stake failed");
      }
      return await res.json();
    },
    onSuccess: async () => {
      toast.success("Staked (mock)");
      await qc.invalidateQueries({ queryKey: ["pools"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pool = q.data?.pools[0];

  return (
    <div className="grid gap-6 lg:grid-cols-2" data-testid="pools-dashboard">
      <Card data-testid="pool-card-primary">
        <CardHeader>
          <CardTitle>{pool?.pair ?? "Pool"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 font-data text-sm">
          <div className="flex justify-between" data-testid="pool-tvl">
            <span className="text-muted-foreground">TVL</span>
            <span>{pool ? formatUsd2(BigInt(pool.tvlUsdCents)) : "—"}</span>
          </div>
          <div className="flex justify-between" data-testid="pool-apr">
            <span className="text-muted-foreground">APR</span>
            <span>
              {pool ? `${(Number(pool.aprBps) / 100).toFixed(2)}%` : "—"}
            </span>
          </div>
          <div className="flex justify-between" data-testid="pool-reserves">
            <span className="text-muted-foreground">Reserves</span>
            <span className="text-right text-xs">
              {pool ? `${formatUsd2(BigInt(pool.reserveSusdCents))} / ${formatSatsToBtc8(BigInt(pool.reserveSats))} BTC` : "—"}
            </span>
          </div>
        </CardContent>
      </Card>
      <Card data-testid="pool-stake-card">
        <CardHeader>
          <CardTitle>Stake sUSD</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stake-amt">Amount (USD)</Label>
            <Input
              id="stake-amt"
              className="font-data"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              data-testid="pool-stake-input"
            />
          </div>
          {err ? (
            <p className="text-sm text-destructive" data-testid="pool-stake-error">
              {err}
            </p>
          ) : null}
          <Button
            disabled={!pool || stake.isPending}
            onClick={() => {
              setErr(null);
              try {
                parseUsdDecimalToCents(amount);
              } catch {
                setErr("Invalid amount");
                return;
              }
              if (pool) {
                stake.mutate(pool.id);
              }
            }}
            data-testid="pool-stake-submit"
          >
            {stake.isPending ? "Staking…" : "Stake to pool"}
          </Button>
          <div className="text-xs text-muted-foreground">
            Positions:{" "}
            <span data-testid="pool-stakes-count">
              {(q.data?.stakes ?? []).length}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
