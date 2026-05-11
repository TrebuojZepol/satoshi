import {
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const vaults = pgTable("vaults", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  collateralSats: text("collateral_sats").notNull(),
  debtSusdCents: text("debt_susd_cents").notNull(),
  ltvBps: text("ltv_bps").notNull(),
  liquidationPriceUsdCents: text("liq_price_usd_cents").notNull(),
  health: text("health").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const batchOrders = pgTable("batch_orders", {
  id: text("id").primaryKey(),
  userKey: text("user_key").notNull(),
  side: text("side").notNull(),
  amountSats: text("amount_sats").notNull(),
  limitPriceUsdCents: text("limit_price_usd_cents").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const settlements = pgTable("settlements", {
  id: text("id").primaryKey(),
  batchId: text("batch_id").notNull(),
  clearingPriceUsdCents: text("clearing_price_usd_cents").notNull(),
  volumeSats: text("volume_sats").notNull(),
  settledAt: timestamp("settled_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const liquidityPools = pgTable("liquidity_pools", {
  id: text("id").primaryKey(),
  pair: text("pair").notNull(),
  tvlUsdCents: text("tvl_usd_cents").notNull(),
  aprBps: text("apr_bps").notNull(),
  reserveSusdCents: text("reserve_susd_cents").notNull(),
  reserveSats: text("reserve_sats").notNull(),
});

export const stakes = pgTable("stakes", {
  id: text("id").primaryKey(),
  poolId: text("pool_id").notNull(),
  stakedSusdCents: text("staked_susd_cents").notNull(),
  rewardsSusdCents: text("rewards_susd_cents").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const susdMetrics = pgTable("susd_metrics", {
  id: text("id").primaryKey(),
  totalSupplySusdCents: text("total_supply_susd_cents").notNull(),
  collateralRatioBps: text("collateral_ratio_bps").notNull(),
  borrowAprBps: text("borrow_apr_bps").notNull(),
  savingsAprBps: text("savings_apr_bps").notNull(),
  pegDeviationBps: text("peg_deviation_bps").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const portfolioSnapshots = pgTable("portfolio_snapshots", {
  id: text("id").primaryKey(),
  totalValueUsdCents: text("total_value_usd_cents").notNull(),
  btcExposureBps: text("btc_exposure_bps").notNull(),
  susdExposureBps: text("susd_exposure_bps").notNull(),
  pnlUsdCents: text("pnl_usd_cents").notNull(),
  capturedAt: timestamp("captured_at", { withTimezone: true, mode: "date" }).notNull(),
});
