import type { batchOrders } from "@/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { getMockBtcUsdCents } from "@/lib/server/oracle";

export type BatchOrderRow = InferSelectModel<typeof batchOrders>;

export function estimateClearingPriceUsdCents(
  orders: BatchOrderRow[],
  nowMs: number = Date.now(),
  oracleUsdCents?: bigint,
): bigint {
  const oracle = oracleUsdCents ?? getMockBtcUsdCents(nowMs);
  const open = orders.filter((o) => o.status === "open");
  const buys = open.filter((o) => o.side === "buy");
  const sells = open.filter((o) => o.side === "sell");
  if (buys.length === 0 || sells.length === 0) {
    return oracle;
  }
  const bestBid = buys.reduce(
    (m, o) => (BigInt(o.limitPriceUsdCents) > m ? BigInt(o.limitPriceUsdCents) : m),
    0n,
  );
  const bestAsk = sells.reduce(
    (m, o) =>
      m === 0n || BigInt(o.limitPriceUsdCents) < m
        ? BigInt(o.limitPriceUsdCents)
        : m,
    0n,
  );
  if (bestBid === 0n || bestAsk === 0n) {
    return oracle;
  }
  return (bestBid + bestAsk) / 2n;
}
