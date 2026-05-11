import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDb, getSchema, resetDbSingletonForTests } from "@/db";
import { validateOrderInput } from "@/lib/server/order-validation";
import { getMockBtcUsdCents } from "@/lib/server/oracle";

describe("validateOrderInput", () => {
  let dbPath: string;
  beforeEach(async () => {
    delete process.env["DATABASE_URL"];
    resetDbSingletonForTests();
    dbPath = path.join(os.tmpdir(), `satoshifi-test-${Date.now()}.db`);
    process.env["BV_DB_PATH"] = dbPath;
    const db = getDb();
    const { batchOrders } = getSchema();
    await db.insert(batchOrders).values({
      id: "open1",
      userKey: "alice",
      side: "buy",
      amountSats: "9000000000",
      limitPriceUsdCents: "9850000",
      status: "open",
      createdAt: new Date(),
    });
  });

  afterEach(() => {
    resetDbSingletonForTests();
    try {
      fs.unlinkSync(dbPath);
    } catch {
      /* ignore */
    }
    delete process.env["BV_DB_PATH"];
    delete process.env["DATABASE_URL"];
  });

  const oracle = () => getMockBtcUsdCents();

  it("rejects below min sats", async () => {
    const db = getDb();
    const r = await validateOrderInput({
      side: "buy",
      amountSats: 50_000n,
      limitPriceUsdCents: oracle(),
      userKey: "bob",
      db,
      oracleUsdCentsOverride: oracle(),
    });
    expect(r.ok).toBe(false);
  });

  it("rejects price outside oracle band", async () => {
    const db = getDb();
    const r = await validateOrderInput({
      side: "buy",
      amountSats: 200_000n,
      limitPriceUsdCents: oracle() * 2n,
      userKey: "bob",
      db,
      oracleUsdCentsOverride: oracle(),
    });
    expect(r.ok).toBe(false);
  });

  it("rejects when user open exposure exceeds cap", async () => {
    const db = getDb();
    const r = await validateOrderInput({
      side: "sell",
      amountSats: 2_000_000_000n,
      limitPriceUsdCents: oracle(),
      userKey: "alice",
      db,
      oracleUsdCentsOverride: oracle(),
    });
    expect(r.ok).toBe(false);
  });

  it("accepts valid order", async () => {
    const db = getDb();
    const r = await validateOrderInput({
      side: "sell",
      amountSats: 500_000n,
      limitPriceUsdCents: oracle(),
      userKey: "bob",
      db,
      oracleUsdCentsOverride: oracle(),
    });
    expect(r.ok).toBe(true);
  });
});
