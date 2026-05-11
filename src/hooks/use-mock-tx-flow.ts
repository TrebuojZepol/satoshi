"use client";

import { useCallback, useRef, useState } from "react";
import type { TxStep } from "@/components/flow/TransactionFlow";

export function useMockTxFlow(initial: TxStep[]) {
  const initialRef = useRef(initial);
  const [steps, setSteps] = useState<TxStep[]>(initial);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const t of timers.current) {
      window.clearTimeout(t);
    }
    timers.current = [];
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setSteps(
      initialRef.current.map((s) => ({ ...s, status: "pending" as const })),
    );
  }, [clearTimers]);

  const start = useCallback(() => {
    clearTimers();
    setSteps((prev) =>
      prev.map((s, i) => (i === 0 ? { ...s, status: "broadcast" as const } : s)),
    );
    const t1 = window.setTimeout(() => {
      setSteps((prev) =>
        prev.map((s, i) =>
          i === 0
            ? {
                ...s,
                status: "confirming" as const,
                confirmations: 0,
                targetConfirmations: 2,
              }
            : s,
        ),
      );
    }, 400);
    timers.current.push(t1);
    const t2 = window.setTimeout(() => {
      setSteps((prev) =>
        prev.map((s, i) =>
          i === 0
            ? {
                ...s,
                status: "confirming" as const,
                confirmations: 1,
                targetConfirmations: 2,
              }
            : s,
        ),
      );
    }, 900);
    timers.current.push(t2);
    const t3 = window.setTimeout(() => {
      setSteps((prev) =>
        prev.map((s, i) =>
          i === 0
            ? {
                ...s,
                status: "confirmed" as const,
                confirmations: 2,
                targetConfirmations: 2,
              }
            : s,
        ),
      );
    }, 1400);
    timers.current.push(t3);
  }, [clearTimers]);

  return { steps, setSteps, start, reset };
}
