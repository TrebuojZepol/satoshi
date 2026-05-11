"use client";

import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AreaSeries,
  ColorType,
  CrosshairMode,
  createChart,
  type UTCTimestamp,
} from "lightweight-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUsd2 } from "@/lib/money";

type Snap = {
  id: string;
  totalValueUsdCents: string;
  btcExposureBps: string;
  susdExposureBps: string;
  pnlUsdCents: string;
  capturedAt: string;
};

export function PortfolioClient() {
  const q = useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => {
      const res = await fetch("/api/portfolio");
      if (!res.ok) {
        throw new Error("Failed to load portfolio");
      }
      return (await res.json()) as { snapshots: Snap[] };
    },
  });

  const snaps = [...(q.data?.snapshots ?? [])].sort(
    (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime(),
  );

  const areaData = useMemo(
    () =>
      snaps.map((s) => ({
        t: new Date(s.capturedAt).toLocaleDateString(),
        value: Number(s.totalValueUsdCents) / 100,
      })),
    [snaps],
  );

  const lw = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = lw.current;
    if (!el || snaps.length === 0) {
      return;
    }
    el.replaceChildren();
    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: "#0f172a" },
        textColor: "#cbd5e1",
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      crosshair: { mode: CrosshairMode.Magnet },
      rightPriceScale: { borderColor: "#334155" },
      timeScale: { borderColor: "#334155" },
      width: el.clientWidth,
      height: 220,
    });
    const series = chart.addSeries(AreaSeries, {
      lineColor: "#F7931A",
      topColor: "rgba(247, 147, 26, 0.35)",
      bottomColor: "rgba(247, 147, 26, 0.02)",
    });
    series.setData(
      snaps.map((s) => ({
        time: Math.floor(Date.parse(s.capturedAt) / 1000) as UTCTimestamp,
        value: Number(s.totalValueUsdCents) / 100,
      })),
    );
    chart.timeScale().fitContent();
    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth });
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [snaps]);

  const latest = snaps[snaps.length - 1];

  return (
    <div className="space-y-6" data-testid="portfolio-dashboard">
      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="portfolio-metric-tv">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Total value
            </CardTitle>
          </CardHeader>
          <CardContent className="font-data text-xl" data-testid="portfolio-total-value">
            {latest ? formatUsd2(BigInt(latest.totalValueUsdCents)) : "—"}
          </CardContent>
        </Card>
        <Card data-testid="portfolio-metric-btc">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">BTC exposure</CardTitle>
          </CardHeader>
          <CardContent className="font-data text-xl" data-testid="portfolio-btc-exp">
            {latest ? `${(Number(latest.btcExposureBps) / 100).toFixed(2)}%` : "—"}
          </CardContent>
        </Card>
        <Card data-testid="portfolio-metric-pnl">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">PnL</CardTitle>
          </CardHeader>
          <CardContent className="font-data text-xl" data-testid="portfolio-pnl">
            {latest ? formatUsd2(BigInt(latest.pnlUsdCents)) : "—"}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Equity curve (Recharts)</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F7931A" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#F7931A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="t" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#F7931A"
                fillOpacity={1}
                fill="url(#colorVal)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Lightweight intraday mock</CardTitle>
        </CardHeader>
        <CardContent ref={lw} className="h-[240px]" data-testid="portfolio-lw-chart" />
      </Card>
    </div>
  );
}
