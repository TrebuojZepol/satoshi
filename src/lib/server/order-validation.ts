import { and, eq, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { getSchema } from "@/db";
import {
  MAX_ORDER_SATS,
  MAX_USER_OPEN_SATS_PER_BATCH,
  MIN_ORDER_SATS,
  ORACLE_PRICE_BAND_BPS,
} from "@/lib/constants";
import { getOracleBtcUsdCents } from "@/lib/server/oracle";

export type OrderSide = "buy" | "sell";

export async function validateOrderInput(input: {
  side: OrderSide;
  amountSats: bigint;
  limitPriceUsdCents: bigint;
  userKey: string;
  db: Db;
  nowMs?: number;
  /** Tests / deterministic paths without hitting CoinGecko. */
  oracleUsdCentsOverride?: bigint;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const nowMs = input.nowMs ?? Date.now();
  if (input.amountSats < MIN_ORDER_SATS) {
    return {
      ok: false,
      message: `Minimum order size is ${MIN_ORDER_SATS.toString()} sats`,
    };
  }
  if (input.amountSats > MAX_ORDER_SATS) {
    return {
      ok: false,
      message: `Maximum single order is ${MAX_ORDER_SATS.toString()} sats`,
    };
  }

  const oracle =
    input.oracleUsdCentsOverride ?? (await getOracleBtcUsdCents(nowMs));
  const low = (oracle * (10_000n - ORACLE_PRICE_BAND_BPS)) / 10_000n;
  const high = (oracle * (10_000n + ORACLE_PRICE_BAND_BPS)) / 10_000n;
  if (input.limitPriceUsdCents < low || input.limitPriceUsdCents > high) {
    return {
      ok: false,
      message: "Limit price must be within ±20% of the oracle reference",
    };
  }

  const { batchOrders } = getSchema();
  const rows = await input.db
    .select({
      sum: sql<string>`coalesce(sum(cast(${batchOrders.amountSats} as integer)), 0)`,
    })
    .from(batchOrders)
    .where(
      and(eq(batchOrders.userKey, input.userKey), eq(batchOrders.status, "open")),
    );
  const currentOpen = BigInt(rows[0]?.sum ?? "0");
  if (currentOpen + input.amountSats > MAX_USER_OPEN_SATS_PER_BATCH) {
    return {
      ok: false,
      message:
        "Total open batch exposure for this wallet exceeds the per-batch cap",
    };
  }

  return { ok: true };
}
