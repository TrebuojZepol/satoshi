"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { formatSatsToBtc8, formatUsd2 } from "@/lib/money";
import { cn } from "@/lib/utils";

export type VaultRow = {
  id: string;
  label: string;
  collateralSats: string;
  debtSusdCents: string;
  ltvBps: string;
  liquidationPriceUsdCents: string;
  health: string;
};

function ltvGaugeClass(ltvBps: bigint): string {
  if (ltvBps < 4500n) {
    return "bg-emerald-500";
  }
  if (ltvBps < 6000n) {
    return "bg-amber-400";
  }
  if (ltvBps < 7500n) {
    return "bg-orange-500";
  }
  return "bg-red-500";
}

function ltvBarColor(ltvBps: bigint): string {
  if (ltvBps < 4500n) {
    return "#10b981";
  }
  if (ltvBps < 6000n) {
    return "#facc15";
  }
  if (ltvBps < 7500n) {
    return "#f97316";
  }
  return "#ef4444";
}

export function VaultCard({
  vault,
  onRefresh,
}: {
  vault: VaultRow;
  onRefresh: () => Promise<void>;
}) {
  const ltvBps = BigInt(vault.ltvBps);
  const ltvPct = Number(ltvBps) / 100;
  const [borrow, setBorrow] = useState("");
  const [repay, setRepay] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function patch(
    action: string,
    body: Record<string, string>,
    key: string,
  ) {
    setErr(null);
    setLoading(key);
    try {
      const res = await fetch(`/api/vaults/${vault.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? res.statusText);
      }
      await onRefresh();
      toast.success("Vault updated (mock)");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card data-testid={`vault-card-${vault.id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base">{vault.label}</CardTitle>
          <p
            className={cn(
              "mt-1 text-xs font-medium uppercase tracking-wide",
              vault.health === "healthy" && "text-emerald-400",
              vault.health === "caution" && "text-amber-400",
              vault.health === "at_risk" && "text-orange-400",
              vault.health === "liquidated" && "text-red-400",
            )}
            data-testid={`vault-card-${vault.id}-health`}
          >
            {vault.health.replace("_", " ")}
          </p>
        </div>
        <div className="text-right font-data text-xs text-muted-foreground">
          <div data-testid={`vault-card-${vault.id}-ltv`}>LTV {ltvPct.toFixed(2)}%</div>
          <div data-testid={`vault-card-${vault.id}-liq`}>
            Liq. {formatUsd2(BigInt(vault.liquidationPriceUsdCents))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>LTV gauge</span>
            <span>{ltvPct.toFixed(2)}%</span>
          </div>
          <div className="relative h-3 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", ltvGaugeClass(ltvBps))}
              style={{
                width: `${Math.min(100, ltvPct)}%`,
                backgroundColor: ltvBarColor(ltvBps),
              }}
              data-testid={`vault-card-${vault.id}-ltv-gauge`}
            />
          </div>
          <Progress value={Math.min(100, ltvPct)} className="mt-2 h-1 opacity-40" />
        </div>
        <div className="grid grid-cols-2 gap-3 font-data text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Collateral</p>
            <p data-testid={`vault-card-${vault.id}-collateral`}>
              {formatSatsToBtc8(BigInt(vault.collateralSats))} BTC
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Debt</p>
            <p data-testid={`vault-card-${vault.id}-debt`}>
              {formatUsd2(BigInt(vault.debtSusdCents))} sUSD
            </p>
          </div>
        </div>
        {err ? (
          <p className="text-sm text-destructive" data-testid={`vault-card-${vault.id}-error`}>
            {err}
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`borrow-${vault.id}`}>Borrow sUSD (cents)</Label>
            <Input
              id={`borrow-${vault.id}`}
              value={borrow}
              onChange={(e) => setBorrow(e.target.value)}
              inputMode="numeric"
              data-testid={`vault-card-${vault.id}-borrow-input`}
            />
            <Button
              size="sm"
              disabled={loading !== null}
              onClick={() =>
                void patch("borrow", { amountSusdCents: borrow }, "borrow").then(() =>
                  setBorrow(""),
                )
              }
              data-testid={`vault-card-${vault.id}-borrow`}
            >
              {loading === "borrow" ? "Borrowing…" : "Borrow"}
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`repay-${vault.id}`}>Repay sUSD (cents)</Label>
            <Input
              id={`repay-${vault.id}`}
              value={repay}
              onChange={(e) => setRepay(e.target.value)}
              inputMode="numeric"
              data-testid={`vault-card-${vault.id}-repay-input`}
            />
            <Button
              size="sm"
              variant="secondary"
              disabled={loading !== null}
              onClick={() =>
                void patch("repay", { amountSusdCents: repay }, "repay").then(() =>
                  setRepay(""),
                )
              }
              data-testid={`vault-card-${vault.id}-repay`}
            >
              {loading === "repay" ? "Repaying…" : "Repay"}
            </Button>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          disabled={loading !== null || vault.health === "liquidated"}
          onClick={() => void patch("liquidate", {}, "liq")}
          data-testid={`vault-card-${vault.id}-liquidate`}
        >
          {loading === "liq" ? "Liquidating…" : "Liquidate (mock)"}
        </Button>
      </CardContent>
    </Card>
  );
}
