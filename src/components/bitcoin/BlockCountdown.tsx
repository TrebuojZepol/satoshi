"use client";

import { useEffect, useMemo, useState } from "react";
import { useBlockStream } from "@/hooks/use-block-stream";
import { cn } from "@/lib/utils";

function formatMs(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function ringColor(nextBlockInMs: number): string {
  if (nextBlockInMs > 5 * 60 * 1000) {
    return "#10b981";
  }
  if (nextBlockInMs > 2 * 60 * 1000) {
    return "#f59e0b";
  }
  return "#ef4444";
}

export function BlockCountdown() {
  const { data, error } = useBlockStream();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const live = useMemo(() => {
    if (!data) {
      return null;
    }
    const elapsed = now - data.serverTimeMs;
    const next = Math.max(0, data.nextBlockInMs - elapsed);
    const prog =
      data.blockTimeMs > 0 ? 1 - next / data.blockTimeMs : data.progress;
    return { height: data.height, nextBlockInMs: next, progress: prog };
  }, [data, now]);

  const stroke = live ? ringColor(live.nextBlockInMs) : "#64748b";
  const r = 36;
  const c = 2 * Math.PI * r;
  const dash = live ? c * (1 - live.progress) : c;

  return (
    <div
      className="flex items-center gap-3"
      data-testid="block-countdown"
    >
      <div className="relative h-20 w-20">
        <svg className="-rotate-90 transform" viewBox="0 0 88 88">
          <circle
            cx="44"
            cy="44"
            r={r}
            stroke="#334155"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="44"
            cy="44"
            r={r}
            stroke={stroke}
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={dash}
            strokeLinecap="round"
            className={cn(
              live && live.nextBlockInMs < 30_000 && "animate-pulse",
            )}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-data text-[10px] text-muted-foreground">
            BLOCK
          </span>
          <span className="font-data text-sm font-semibold" data-testid="block-height">
            {live?.height ?? "—"}
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Next block</p>
        <p
          className="font-data text-lg font-semibold tracking-tight"
          data-testid="block-countdown-timer"
        >
          {live ? formatMs(live.nextBlockInMs) : "—:—"}
        </p>
        {error || data?.error ? (
          <p className="text-xs text-destructive" data-testid="block-stream-error">
            {data?.error ?? error}
          </p>
        ) : null}
        {data?.source === "rpc" ? (
          <p className="text-[10px] text-muted-foreground" data-testid="block-source-rpc">
            Live chain
          </p>
        ) : null}
      </div>
    </div>
  );
}
