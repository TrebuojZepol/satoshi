import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const vaults = sqliteTable("vaults", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  collateralSats: text("collateral_sats").notNull(),
  debtSusdCents: text("debt_susd_cents").notNull(),
  ltvBps: text("ltv_bps").notNull(),
  liquidationPriceUsdCents: text("liq_price_usd_cents").notNull(),
  health: text("health").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const batchOrders = sqliteTable("batch_orders", {
  id: text("id").primaryKey(),
  userKey: text("user_key").notNull(),
  side: text("side").notNull(),
  amountSats: text("amount_sats").notNull(),
  limitPriceUsdCents: text("limit_price_usd_cents").notNull(),
  status: text("status").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const settlements = sqliteTable("settlements", {
  id: text("id").primaryKey(),
  batchId: text("batch_id").notNull(),
  clearingPriceUsdCents: text("clearing_price_usd_cents").notNull(),
  volumeSats: text("volume_sats").notNull(),
  settledAt: integer("settled_at", { mode: "timestamp" }).notNull(),
});

export const liquidityPools = sqliteTable("liquidity_pools", {
  id: text("id").primaryKey(),
  pair: text("pair").notNull(),
  tvlUsdCents: text("tvl_usd_cents").notNull(),
  aprBps: text("apr_bps").notNull(),
  reserveSusdCents: text("reserve_susd_cents").notNull(),
  reserveSats: text("reserve_sats").notNull(),
});

export const stakes = sqliteTable("stakes", {
  id: text("id").primaryKey(),
  poolId: text("pool_id").notNull(),
  stakedSusdCents: text("staked_susd_cents").notNull(),
  rewardsSusdCents: text("rewards_susd_cents").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const susdMetrics = sqliteTable("susd_metrics", {
  id: text("id").primaryKey(),
  totalSupplySusdCents: text("total_supply_susd_cents").notNull(),
  collateralRatioBps: text("collateral_ratio_bps").notNull(),
  borrowAprBps: text("borrow_apr_bps").notNull(),
  savingsAprBps: text("savings_apr_bps").notNull(),
  pegDeviationBps: text("peg_deviation_bps").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const portfolioSnapshots = sqliteTable("portfolio_snapshots", {
  id: text("id").primaryKey(),
  totalValueUsdCents: text("total_value_usd_cents").notNull(),
  btcExposureBps: text("btc_exposure_bps").notNull(),
  susdExposureBps: text("susd_exposure_bps").notNull(),
  pnlUsdCents: text("pnl_usd_cents").notNull(),
  capturedAt: integer("captured_at", { mode: "timestamp" }).notNull(),
});
