"use client";

import { useEffect, useState } from "react";
import type { BlockStreamPayload } from "@/lib/bitcoin/block-stream-types";

export type { BlockStreamPayload };

export function useBlockStream() {
  const [data, setData] = useState<BlockStreamPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/bitcoin/stream");
    es.onmessage = (ev) => {
      try {
        const parsed = JSON.parse(ev.data) as BlockStreamPayload;
        setData(parsed);
        setError(parsed.error ?? null);
      } catch {
        setError("Invalid block stream payload");
      }
    };
    es.onerror = () => {
      setError("Block stream disconnected");
    };
    return () => {
      es.close();
    };
  }, []);

  return { data, error };
}
