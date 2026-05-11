"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VaultCard, type VaultRow } from "@/components/vault/VaultCard";
import { parseBtcDecimalString, parseUsdDecimalToCents } from "@/lib/money";

export function VaultsClient() {
  const qc = useQueryClient();
  const [label, setLabel] = useState("New vault");
  const [colBtc, setColBtc] = useState("0.50000000");
  const [debtUsd, setDebtUsd] = useState("1000.00");
  const [formErr, setFormErr] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["vaults"],
    queryFn: async () => {
      const res = await fetch("/api/vaults");
      if (!res.ok) {
        throw new Error("Failed to load vaults");
      }
      return (await res.json()) as { vaults: VaultRow[] };
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      let collateralSats: bigint;
      let debtSusdCents: bigint;
      try {
        collateralSats = parseBtcDecimalString(colBtc);
        debtSusdCents = parseUsdDecimalToCents(debtUsd);
      } catch {
        throw new Error("Invalid collateral or debt");
      }
      const res = await fetch("/api/vaults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          collateralSats: collateralSats.toString(),
          debtSusdCents: debtSusdCents.toString(),
        }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "Create failed");
      }
      return await res.json();
    },
    onSuccess: async () => {
      toast.success("Vault created");
      await qc.invalidateQueries({ queryKey: ["vaults"] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  function onCreate() {
    setFormErr(null);
    try {
      parseBtcDecimalString(colBtc);
      parseUsdDecimalToCents(debtUsd);
    } catch {
      setFormErr("Invalid amounts");
      return;
    }
    create.mutate();
  }

  return (
    <div className="space-y-8">
      <section
        className="rounded-lg border border-border bg-card p-4"
        data-testid="vault-create-form"
      >
        <h2 className="mb-4 text-lg font-medium">Create vault</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="vault-label">Label</Label>
            <Input
              id="vault-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              data-testid="vault-create-label"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vault-col">Collateral (BTC)</Label>
            <Input
              id="vault-col"
              className="font-data"
              value={colBtc}
              onChange={(e) => setColBtc(e.target.value)}
              data-testid="vault-create-collateral"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vault-debt">Initial debt (sUSD)</Label>
            <Input
              id="vault-debt"
              className="font-data"
              value={debtUsd}
              onChange={(e) => setDebtUsd(e.target.value)}
              data-testid="vault-create-debt"
            />
          </div>
        </div>
        {formErr ? (
          <p className="mt-2 text-sm text-destructive" data-testid="vault-create-error">
            {formErr}
          </p>
        ) : null}
        <Button
          className="mt-4"
          onClick={onCreate}
          disabled={create.isPending}
          data-testid="vault-create-submit"
        >
          {create.isPending ? "Creating…" : "Create vault"}
        </Button>
      </section>
      {q.isError ? (
        <p className="text-destructive" data-testid="vaults-load-error">
          {(q.error as Error).message}
        </p>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {(q.data?.vaults ?? []).map((v) => (
          <VaultCard
            key={v.id}
            vault={v}
            onRefresh={async () => {
              await qc.invalidateQueries({ queryKey: ["vaults"] });
            }}
          />
        ))}
      </div>
    </div>
  );
}
