"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatSatsToBtc8, formatUsd2, parseBtcDecimalString, parseUsdDecimalToCents } from "@/lib/money";
import { TransactionFlow } from "@/components/flow/TransactionFlow";
import { useMockTxFlow } from "@/hooks/use-mock-tx-flow";
import {
  MAX_ORDER_SATS,
  MIN_ORDER_SATS,
  ORACLE_PRICE_BAND_BPS,
} from "@/lib/constants";
import { useWalletStore } from "@/stores/wallet-store";

type Order = {
  id: string;
  userKey: string;
  side: string;
  amountSats: string;
  limitPriceUsdCents: string;
  status: string;
  createdAt: string;
};

type OrdersResponse = {
  orders: Order[];
  openOrders?: Order[];
  filledOrders?: Order[];
  clearingPriceUsdCents: string;
  matchedVolumeSats: string;
};

type SettlementRow = {
  id: string;
  batchId: string;
  clearingPriceUsdCents: string;
  volumeSats: string;
  settledAt: string;
};

type SettlementPsbtApiResponse = {
  enabled: boolean;
  plan?: {
    matchedVolumeSats: string;
    clearingPriceUsdCents: string;
    updateCount: number;
  };
  message?: string;
  error?: string;
  psbtBase64?: string;
  changeAddress?: string;
  feeSats?: number;
  hint?: string;
};

function clientValidate(params: {
  amountSats: bigint;
  limitPriceUsdCents: bigint;
  oracleCents: bigint;
}): string | null {
  if (params.amountSats < MIN_ORDER_SATS) {
    return `Minimum order is ${MIN_ORDER_SATS.toString()} sats`;
  }
  if (params.amountSats > MAX_ORDER_SATS) {
    return `Maximum single order is ${MAX_ORDER_SATS.toString()} sats`;
  }
  const low = (params.oracleCents * (10_000n - ORACLE_PRICE_BAND_BPS)) / 10_000n;
  const high = (params.oracleCents * (10_000n + ORACLE_PRICE_BAND_BPS)) / 10_000n;
  if (params.limitPriceUsdCents < low || params.limitPriceUsdCents > high) {
    return "Limit must be within ±20% of oracle";
  }
  return null;
}

export function BatchAuctionPanel() {
  const qc = useQueryClient();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amountBtc, setAmountBtc] = useState("0.01000000");
  const [limitUsd, setLimitUsd] = useState("98500.00");
  const [formErr, setFormErr] = useState<string | null>(null);
  const [txOpen, setTxOpen] = useState(false);
  const [feeSatsInput, setFeeSatsInput] = useState("500");
  const [psbtResult, setPsbtResult] = useState<SettlementPsbtApiResponse | null>(
    null,
  );
  const [signedPsbt, setSignedPsbt] = useState<string | null>(null);
  const provider = useWalletStore((s) => s.provider);
  const connected = useWalletStore((s) => s.connected);
  const signPsbtWithUnisat = useWalletStore((s) => s.signPsbtWithUnisat);
  const pushPsbtWithUnisat = useWalletStore((s) => s.pushPsbtWithUnisat);
  const { steps, start, reset } = useMockTxFlow([
    {
      id: "settle",
      label: "Settle batch (mock confirmations)",
      status: "pending",
    },
  ]);

  const prices = useQuery({
    queryKey: ["prices"],
    queryFn: async () => {
      const res = await fetch("/api/prices");
      if (!res.ok) {
        throw new Error("Failed to load prices");
      }
      return (await res.json()) as { btcUsdCents: string };
    },
    refetchInterval: 15_000,
  });

  const ordersQ = useQuery({
    queryKey: ["batch-orders"],
    queryFn: async () => {
      const res = await fetch("/api/batch/orders");
      if (!res.ok) {
        throw new Error("Failed to load orders");
      }
      return (await res.json()) as OrdersResponse;
    },
    refetchInterval: 10_000,
  });

  const historyQ = useQuery({
    queryKey: ["batch-history"],
    queryFn: async () => {
      const res = await fetch("/api/batch/history");
      if (!res.ok) {
        throw new Error("Failed to load history");
      }
      return (await res.json()) as { settlements: SettlementRow[] };
    },
  });

  const place = useMutation({
    mutationFn: async (payload: { side: "buy" | "sell"; amountSats: string; limitPriceUsdCents: string }) => {
      const res = await fetch("/api/batch/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "Order failed");
      }
      return (await res.json()) as { orders: Order[] };
    },
    onSuccess: async () => {
      toast.success("Order placed");
      await qc.invalidateQueries({ queryKey: ["batch-orders"] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  const settlementPsbt = useMutation({
    mutationFn: async () => {
      let feeSats = 500;
      const parsed = Number.parseInt(feeSatsInput, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        feeSats = parsed;
      }
      const res = await fetch("/api/batch/settlement-psbt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeSats }),
      });
      const j = (await res.json()) as SettlementPsbtApiResponse;
      if (!res.ok) {
        throw new Error(j.error ?? "PSBT request failed");
      }
      return j;
    },
    onSuccess: (data) => {
      setPsbtResult(data);
      setSignedPsbt(null);
      if (data.enabled && data.psbtBase64) {
        toast.success("Settlement PSBT built");
      } else if (data.message) {
        toast.message(data.message);
      }
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  const settle = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/batch/settle", { method: "POST" });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "Settlement failed");
      }
      return await res.json();
    },
    onSuccess: async () => {
      toast.success("Batch settled (mock)");
      await qc.invalidateQueries({ queryKey: ["batch-orders"] });
      await qc.invalidateQueries({ queryKey: ["batch-history"] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  const oracle = useMemo(() => {
    try {
      return BigInt(prices.data?.btcUsdCents ?? "0");
    } catch {
      return 0n;
    }
  }, [prices.data]);

  const openOrders = useMemo(() => {
    if (ordersQ.data?.openOrders) {
      return ordersQ.data.openOrders;
    }
    return (ordersQ.data?.orders ?? []).filter((o) => o.status === "open");
  }, [ordersQ.data]);

  const filledOrders = useMemo(() => {
    if (ordersQ.data?.filledOrders) {
      return ordersQ.data.filledOrders;
    }
    return (ordersQ.data?.orders ?? [])
      .filter((o) => o.status === "filled")
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [ordersQ.data]);

  function submitOrder() {
    setFormErr(null);
    let amountSats: bigint;
    let limitPriceUsdCents: bigint;
    try {
      amountSats = parseBtcDecimalString(amountBtc);
      limitPriceUsdCents = parseUsdDecimalToCents(limitUsd);
    } catch {
      setFormErr("Invalid amount or limit");
      return;
    }
    const o = oracle > 0n ? oracle : 98_500_00n;
    const v = clientValidate({ amountSats, limitPriceUsdCents, oracleCents: o });
    if (v) {
      setFormErr(v);
      return;
    }
    place.mutate({
      side,
      amountSats: amountSats.toString(),
      limitPriceUsdCents: limitPriceUsdCents.toString(),
    });
  }

  async function runSettlement() {
    reset();
    start();
    try {
      await settle.mutateAsync();
    } catch {
      /* toast */
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2" data-testid="batch-auction-panel">
      <Card>
        <CardHeader>
          <CardTitle>Place order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Side</Label>
            <Select
              value={side}
              onValueChange={(v) => setSide(v as "buy" | "sell")}
            >
              <SelectTrigger data-testid="batch-order-side">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Buy BTC</SelectItem>
                <SelectItem value="sell">Sell BTC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="batch-amount-btc">Size (BTC, 8 dp)</Label>
            <Input
              id="batch-amount-btc"
              value={amountBtc}
              onChange={(e) => setAmountBtc(e.target.value)}
              className="font-data"
              data-testid="batch-order-amount-btc"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="batch-limit-usd">Limit (USD / BTC)</Label>
            <Input
              id="batch-limit-usd"
              value={limitUsd}
              onChange={(e) => setLimitUsd(e.target.value)}
              className="font-data"
              data-testid="batch-order-limit-usd"
            />
          </div>
          <p className="text-xs text-muted-foreground" data-testid="batch-oracle-ref">
            Oracle ref: {oracle > 0n ? formatUsd2(oracle) : "loading…"} (±20% band enforced)
          </p>
          {formErr ? (
            <p className="text-sm text-destructive" data-testid="batch-order-form-error">
              {formErr}
            </p>
          ) : null}
          <Button
            onClick={submitOrder}
            disabled={place.isPending || prices.isLoading}
            data-testid="batch-order-submit"
          >
            {place.isPending ? "Submitting…" : "Submit limit order"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Batch engine</CardTitle>
            <p className="text-sm text-muted-foreground">
              Est. matched at clearing (FIFO, partial fills):{" "}
              {formatSatsToBtc8(BigInt(ordersQ.data?.matchedVolumeSats ?? "0"))} BTC
            </p>
          </div>
          <div className="text-right font-data text-sm" data-testid="batch-clearing-price">
            Est. clearing{" "}
            <span className="font-semibold text-accent">
              {formatUsd2(BigInt(ordersQ.data?.clearingPriceUsdCents ?? "0"))}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                reset();
                setTxOpen(true);
              }}
              data-testid="batch-settle-open"
            >
              Open settlement flow
            </Button>
            <Button
              onClick={() => void runSettlement()}
              disabled={settle.isPending}
              data-testid="batch-settle-submit"
            >
              {settle.isPending ? "Settling…" : "Settle batch now"}
            </Button>
          </div>
          <div className="rounded-md border border-border bg-muted/20 p-3 space-y-3">
            <p className="text-sm font-medium">On-chain PSBT (dev / funded UTXO)</p>
            <p className="text-xs text-muted-foreground">
              Server builds a 1-in / 1-out PSBT when{" "}
              <code className="rounded bg-muted px-1">BITVAULT_PSBT_UTXO</code> is set.
              Never put mainnet WIFs in env in production.
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="grid gap-1">
                <Label htmlFor="batch-psbt-fee" className="text-xs">
                  Fee (sats)
                </Label>
                <Input
                  id="batch-psbt-fee"
                  className="h-9 w-28 font-data text-sm"
                  value={feeSatsInput}
                  onChange={(e) => setFeeSatsInput(e.target.value)}
                  data-testid="batch-psbt-fee-sats"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={settlementPsbt.isPending}
                onClick={() => settlementPsbt.mutate()}
                data-testid="batch-psbt-build"
              >
                {settlementPsbt.isPending ? "Building…" : "Build settlement PSBT"}
              </Button>
              {psbtResult?.psbtBase64 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(psbtResult.psbtBase64!);
                    toast.success("PSBT copied");
                  }}
                  data-testid="batch-psbt-copy"
                >
                  Copy PSBT
                </Button>
              ) : null}
              {psbtResult?.psbtBase64 && provider === "unisat" && connected ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const s = await signPsbtWithUnisat(psbtResult.psbtBase64!);
                      setSignedPsbt(s);
                      toast.success("Signed in UniSat");
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Sign failed");
                    }
                  }}
                  data-testid="batch-psbt-sign"
                >
                  Sign with UniSat
                </Button>
              ) : null}
              {signedPsbt && provider === "unisat" && connected ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const txid = await pushPsbtWithUnisat(signedPsbt);
                      toast.success(`Broadcast: ${txid}`);
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Broadcast failed");
                    }
                  }}
                  data-testid="batch-psbt-broadcast"
                >
                  Broadcast
                </Button>
              ) : null}
            </div>
            {psbtResult && !psbtResult.enabled && psbtResult.message ? (
              <p className="text-xs text-muted-foreground" data-testid="batch-psbt-disabled-msg">
                {psbtResult.message}
              </p>
            ) : null}
            {psbtResult?.error ? (
              <p className="text-xs text-destructive">{psbtResult.error}</p>
            ) : null}
            {psbtResult?.enabled && psbtResult.changeAddress ? (
              <p className="text-xs font-data text-muted-foreground">
                Change → {psbtResult.changeAddress} (fee {psbtResult.feeSats ?? "—"} sats)
              </p>
            ) : null}
            {psbtResult?.psbtBase64 ? (
              <ScrollArea className="h-24 w-full rounded border border-border bg-background p-2">
                <pre
                  className="whitespace-pre-wrap break-all font-data text-[10px] leading-tight"
                  data-testid="batch-psbt-preview"
                >
                  {psbtResult.psbtBase64}
                </pre>
              </ScrollArea>
            ) : null}
            {signedPsbt ? (
              <p className="text-xs text-muted-foreground">
                Signed PSBT ready ({signedPsbt.length} chars). Use Broadcast on regtest.
              </p>
            ) : null}
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Order book</p>
            <Tabs defaultValue="open" className="w-full" data-testid="batch-order-book-tabs">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="open" data-testid="batch-tab-open">
                  Open ({openOrders.length})
                </TabsTrigger>
                <TabsTrigger value="filled" data-testid="batch-tab-filled">
                  Filled ({filledOrders.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="open" className="mt-3">
                <ScrollArea className="h-48 rounded-md border border-border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="p-2">Side</th>
                        <th className="p-2">Remaining</th>
                        <th className="p-2">Limit</th>
                      </tr>
                    </thead>
                    <tbody className="font-data text-xs">
                      {openOrders.map((o) => (
                        <tr key={o.id} data-testid={`batch-open-order-${o.id}`}>
                          <td className="p-2">{o.side}</td>
                          <td className="p-2">
                            {formatSatsToBtc8(BigInt(o.amountSats))}
                          </td>
                          <td className="p-2">
                            {formatUsd2(BigInt(o.limitPriceUsdCents))}
                          </td>
                        </tr>
                      ))}
                      {openOrders.length === 0 ? (
                        <tr>
                          <td className="p-3 text-muted-foreground" colSpan={3}>
                            No open orders
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="filled" className="mt-3">
                <ScrollArea className="h-48 rounded-md border border-border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="p-2">Side</th>
                        <th className="p-2">Remaining</th>
                        <th className="p-2">Limit</th>
                      </tr>
                    </thead>
                    <tbody className="font-data text-xs">
                      {filledOrders.map((o) => (
                        <tr key={o.id} data-testid={`batch-filled-order-${o.id}`}>
                          <td className="p-2">{o.side}</td>
                          <td className="p-2">
                            {formatSatsToBtc8(BigInt(o.amountSats))}
                          </td>
                          <td className="p-2">
                            {formatUsd2(BigInt(o.limitPriceUsdCents))}
                          </td>
                        </tr>
                      ))}
                      {filledOrders.length === 0 ? (
                        <tr>
                          <td className="p-3 text-muted-foreground" colSpan={3}>
                            No filled orders yet
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Settlement history</p>
            <ScrollArea className="h-40 rounded-md border border-border">
              <ul className="divide-y divide-border text-sm">
                {(historyQ.data?.settlements ?? []).map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap justify-between gap-2 p-2 font-data text-xs"
                    data-testid={`batch-settlement-${s.id}`}
                  >
                    <span>{new Date(s.settledAt).toLocaleString()}</span>
                    <span>{formatUsd2(BigInt(s.clearingPriceUsdCents))}</span>
                    <span>{formatSatsToBtc8(BigInt(s.volumeSats))} BTC</span>
                  </li>
                ))}
                {(historyQ.data?.settlements ?? []).length === 0 ? (
                  <li className="p-3 text-muted-foreground">No settlements yet</li>
                ) : null}
              </ul>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      <TransactionFlow
        open={txOpen}
        onOpenChange={(o) => {
          setTxOpen(o);
          if (!o) {
            reset();
          }
        }}
        title="Settlement transaction"
        description="Mock step-by-step confirmations for the clearing batch."
        steps={steps}
        primaryAction={{
          label: settle.isPending ? "Settling…" : "Run settlement",
          loading: settle.isPending,
          onClick: async () => {
            await runSettlement();
          },
          testId: "batch-settlement-tx-primary",
        }}
        testId="batch-transaction-flow"
      />
    </div>
  );
}
