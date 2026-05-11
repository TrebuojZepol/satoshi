import type { BatchOrderRow } from "@/lib/batch/pricing";
import { estimateClearingPriceUsdCents } from "@/lib/batch/pricing";

export type OrderSettlementUpdate = {
  id: string;
  newAmountSats: bigint;
  status: "open" | "filled";
};

export type BatchSettlementPlan = {
  clearingPriceUsdCents: bigint;
  matchedVolumeSats: bigint;
  updates: OrderSettlementUpdate[];
};

/**
 * Uniform clearing price (mid of best bid / best ask when both sides exist,
 * else oracle). Fills eligible orders FIFO by `createdAt` up to min(buy, sell)
 * volume at that price; supports partial fills by reducing remaining size.
 */
export function computeBatchSettlement(
  orders: BatchOrderRow[],
  nowMs: number = Date.now(),
  oracleUsdCents?: bigint,
): BatchSettlementPlan {
  const clearing = estimateClearingPriceUsdCents(orders, nowMs, oracleUsdCents);
  const open = orders.filter((o) => o.status === "open");

  const eligibleBuys = open
    .filter(
      (o) => o.side === "buy" && BigInt(o.limitPriceUsdCents) >= clearing,
    )
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  const eligibleSells = open
    .filter(
      (o) => o.side === "sell" && BigInt(o.limitPriceUsdCents) <= clearing,
    )
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  const buyVol = eligibleBuys.reduce((a, o) => a + BigInt(o.amountSats), 0n);
  const sellVol = eligibleSells.reduce((a, o) => a + BigInt(o.amountSats), 0n);
  const matched = buyVol < sellVol ? buyVol : sellVol;

  const fillById = new Map<string, bigint>();

  let rem = matched;
  for (const o of eligibleBuys) {
    if (rem <= 0n) {
      break;
    }
    const amt = BigInt(o.amountSats);
    const take = amt <= rem ? amt : rem;
    fillById.set(o.id, (fillById.get(o.id) ?? 0n) + take);
    rem -= take;
  }

  rem = matched;
  for (const o of eligibleSells) {
    if (rem <= 0n) {
      break;
    }
    const amt = BigInt(o.amountSats);
    const take = amt <= rem ? amt : rem;
    fillById.set(o.id, (fillById.get(o.id) ?? 0n) + take);
    rem -= take;
  }

  const updates: OrderSettlementUpdate[] = [];
  for (const [id, filled] of fillById) {
    const row = open.find((o) => o.id === id);
    if (!row) {
      continue;
    }
    const start = BigInt(row.amountSats);
    const newAmt = start - filled;
    if (newAmt < 0n) {
      continue;
    }
    updates.push({
      id,
      newAmountSats: newAmt,
      status: newAmt === 0n ? "filled" : "open",
    });
  }

  return {
    clearingPriceUsdCents: clearing,
    matchedVolumeSats: matched,
    updates,
  };
}

export function estimateMatchedVolumeSats(
  orders: BatchOrderRow[],
  nowMs?: number,
  oracleUsdCents?: bigint,
): bigint {
  return computeBatchSettlement(orders, nowMs, oracleUsdCents).matchedVolumeSats;
}
