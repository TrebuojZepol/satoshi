"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { formatUsd2 } from "@/lib/money";

type Metrics = {
  id: string;
  totalSupplySusdCents: string;
  collateralRatioBps: string;
  borrowAprBps: string;
  savingsAprBps: string;
  pegDeviationBps: string;
  updatedAt: string;
};

export function SusdClient() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["susd-metrics"],
    queryFn: async () => {
      const res = await fetch("/api/susd");
      if (!res.ok) {
        throw new Error("Failed to load sUSD metrics");
      }
      return (await res.json()) as { metrics: Metrics | undefined };
    },
  });

  const m = q.data?.metrics;
  const borrowBps = m ? Number(m.borrowAprBps) : 650;
  const savingsBps = m ? Number(m.savingsAprBps) : 240;
  const [borrow, setBorrow] = useState(borrowBps);
  const [savings, setSavings] = useState(savingsBps);

  useEffect(() => {
    setBorrow(borrowBps);
    setSavings(savingsBps);
  }, [borrowBps, savingsBps]);

  const patch = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/susd", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrowAprBps: String(borrow),
          savingsAprBps: String(savings),
        }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "Update failed");
      }
      return await res.json();
    },
    onSuccess: async () => {
      toast.success("Rates updated");
      await qc.invalidateQueries({ queryKey: ["susd-metrics"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const chartData = useMemo(
    () => [
      { name: "Borrow APR", bps: borrow },
      { name: "Savings APR", bps: savings },
      { name: "Peg dev.", bps: Number(m?.pegDeviationBps ?? 0) },
    ],
    [borrow, savings, m?.pegDeviationBps],
  );

  if (q.isLoading || !m) {
    return <p data-testid="susd-loading">Loading metrics…</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2" data-testid="susd-dashboard">
      <Card>
        <CardHeader>
          <CardTitle>Supply & health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 font-data text-sm">
          <div className="flex justify-between" data-testid="susd-supply">
            <span className="text-muted-foreground">Total supply</span>
            <span>{formatUsd2(BigInt(m.totalSupplySusdCents))}</span>
          </div>
          <div className="flex justify-between" data-testid="susd-cr">
            <span className="text-muted-foreground">Collateral ratio</span>
            <span>{(Number(m.collateralRatioBps) / 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between" data-testid="susd-peg">
            <span className="text-muted-foreground">Peg deviation</span>
            <span>{(Number(m.pegDeviationBps) / 100).toFixed(2)}%</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Interest rate controller</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Borrow APR (bps): {borrow}</Label>
            <Slider
              min={100}
              max={2000}
              step={10}
              value={[borrow]}
              onValueChange={(v) => setBorrow(v[0] ?? borrow)}
              data-testid="susd-slider-borrow"
            />
          </div>
          <div className="space-y-3">
            <Label>Savings APR (bps): {savings}</Label>
            <Slider
              min={0}
              max={1200}
              step={10}
              value={[savings]}
              onValueChange={(v) => setSavings(v[0] ?? savings)}
              data-testid="susd-slider-savings"
            />
          </div>
          <Button
            onClick={() => patch.mutate()}
            disabled={patch.isPending}
            data-testid="susd-rates-save"
          >
            {patch.isPending ? "Saving…" : "Apply rates"}
          </Button>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Rate mix</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155" }}
              />
              <Bar dataKey="bps" fill="#F7931A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
