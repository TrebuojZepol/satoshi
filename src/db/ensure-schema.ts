import type Database from "better-sqlite3";

export function ensureSchema(sqlite: InstanceType<typeof Database>) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS vaults (
      id TEXT PRIMARY KEY NOT NULL,
      label TEXT NOT NULL,
      collateral_sats TEXT NOT NULL,
      debt_susd_cents TEXT NOT NULL,
      ltv_bps TEXT NOT NULL,
      liq_price_usd_cents TEXT NOT NULL,
      health TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS batch_orders (
      id TEXT PRIMARY KEY NOT NULL,
      user_key TEXT NOT NULL,
      side TEXT NOT NULL,
      amount_sats TEXT NOT NULL,
      limit_price_usd_cents TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settlements (
      id TEXT PRIMARY KEY NOT NULL,
      batch_id TEXT NOT NULL,
      clearing_price_usd_cents TEXT NOT NULL,
      volume_sats TEXT NOT NULL,
      settled_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS liquidity_pools (
      id TEXT PRIMARY KEY NOT NULL,
      pair TEXT NOT NULL,
      tvl_usd_cents TEXT NOT NULL,
      apr_bps TEXT NOT NULL,
      reserve_susd_cents TEXT NOT NULL,
      reserve_sats TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS stakes (
      id TEXT PRIMARY KEY NOT NULL,
      pool_id TEXT NOT NULL,
      staked_susd_cents TEXT NOT NULL,
      rewards_susd_cents TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS susd_metrics (
      id TEXT PRIMARY KEY NOT NULL,
      total_supply_susd_cents TEXT NOT NULL,
      collateral_ratio_bps TEXT NOT NULL,
      borrow_apr_bps TEXT NOT NULL,
      savings_apr_bps TEXT NOT NULL,
      peg_deviation_bps TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS portfolio_snapshots (
      id TEXT PRIMARY KEY NOT NULL,
      total_value_usd_cents TEXT NOT NULL,
      btc_exposure_bps TEXT NOT NULL,
      susd_exposure_bps TEXT NOT NULL,
      pnl_usd_cents TEXT NOT NULL,
      captured_at INTEGER NOT NULL
    );
  `);
}
