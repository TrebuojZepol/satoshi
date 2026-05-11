import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  getDbPath,
  getDb,
  initDatabase,
  resetDbSingletonForTests,
  isPostgresDriver,
} from "../src/db/index";
import { ensureSchema } from "../src/db/ensure-schema";
import * as sqliteSchema from "../src/db/schema";
import * as pgSchema from "../src/db/schema-pg";

const TVL_USD = 5_000_000_00n;

async function main() {
  const isTest = process.env["BV_TEST_SEED"] === "1";
  if (isTest) {
    resetDbSingletonForTests();
  }

  if (isPostgresDriver()) {
    await initDatabase();
  } else {
    const dbPath = getDbPath();
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (isTest && fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    const raw = new Database(dbPath);
    raw.pragma("journal_mode = WAL");
    ensureSchema(raw);
    raw.close();
  }

  const db = getDb();
  const now = new Date();

  const vaultRows = [
    {
      id: "vault_seed_healthy",
      label: "BTC-backed — Core",
      collateralSats: "250000000",
      debtSusdCents: "4500000",
      ltvBps: "4200",
      liquidationPriceUsdCents: "8200000",
      health: "healthy",
      createdAt: now,
    },
    {
      id: "vault_seed_caution",
      label: "BTC-backed — Growth",
      collateralSats: "180000000",
      debtSusdCents: "6200000",
      ltvBps: "6100",
      liquidationPriceUsdCents: "8200000",
      health: "caution",
      createdAt: now,
    },
  ] as const;

  const poolRow = {
    id: "pool_susd_btc",
    pair: "sUSD / BTC",
    tvlUsdCents: TVL_USD.toString(),
    aprBps: "812",
    reserveSusdCents: "25000000000",
    reserveSats: "125000000000",
  } as const;

  const stakeRow = {
    id: "stake_demo",
    poolId: "pool_susd_btc",
    stakedSusdCents: "250000000",
    rewardsSusdCents: "1200000",
    updatedAt: now,
  } as const;

  const susdRow = {
    id: "susd_main",
    totalSupplySusdCents: "1840000000000",
    collateralRatioBps: "15200",
    borrowAprBps: "650",
    savingsAprBps: "240",
    pegDeviationBps: "-12",
    updatedAt: now,
  } as const;

  if (isPostgresDriver()) {
    const d = db as NodePgDatabase<typeof pgSchema>;
    await d.delete(pgSchema.batchOrders);
    await d.delete(pgSchema.vaults);
    await d.delete(pgSchema.liquidityPools);
    await d.delete(pgSchema.stakes);
    await d.delete(pgSchema.susdMetrics);
    await d.delete(pgSchema.portfolioSnapshots);
    await d.insert(pgSchema.vaults).values([...vaultRows]);
    await d.insert(pgSchema.liquidityPools).values(poolRow);
    await d.insert(pgSchema.stakes).values(stakeRow);
    await d.insert(pgSchema.susdMetrics).values(susdRow);
    for (let i = 0; i < 32; i++) {
      const t = new Date(now.getTime() - i * 86_400_000);
      const wobble = BigInt(50_000_00 + i * 1_250_00);
      await d.insert(pgSchema.portfolioSnapshots).values({
        id: `snap_${i}`,
        totalValueUsdCents: (1_240_000_00n + wobble).toString(),
        btcExposureBps: "6200",
        susdExposureBps: "3800",
        pnlUsdCents: (120_000_00n + BigInt(i) * 50_00n).toString(),
        capturedAt: t,
      });
    }
    return;
  }

  const d = db as BetterSQLite3Database<typeof sqliteSchema>;
  await d.delete(sqliteSchema.batchOrders);
  await d.delete(sqliteSchema.vaults);
  await d.delete(sqliteSchema.liquidityPools);
  await d.delete(sqliteSchema.stakes);
  await d.delete(sqliteSchema.susdMetrics);
  await d.delete(sqliteSchema.portfolioSnapshots);
  await d.insert(sqliteSchema.vaults).values([...vaultRows]);
  await d.insert(sqliteSchema.liquidityPools).values(poolRow);
  await d.insert(sqliteSchema.stakes).values(stakeRow);
  await d.insert(sqliteSchema.susdMetrics).values(susdRow);
  for (let i = 0; i < 32; i++) {
    const t = new Date(now.getTime() - i * 86_400_000);
    const wobble = BigInt(50_000_00 + i * 1_250_00);
    await d.insert(sqliteSchema.portfolioSnapshots).values({
      id: `snap_${i}`,
      totalValueUsdCents: (1_240_000_00n + wobble).toString(),
      btcExposureBps: "6200",
      susdExposureBps: "3800",
      pnlUsdCents: (120_000_00n + BigInt(i) * 50_00n).toString(),
      capturedAt: t,
    });
  }
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
