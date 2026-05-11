CREATE TABLE "batch_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_key" text NOT NULL,
	"side" text NOT NULL,
	"amount_sats" text NOT NULL,
	"limit_price_usd_cents" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "liquidity_pools" (
	"id" text PRIMARY KEY NOT NULL,
	"pair" text NOT NULL,
	"tvl_usd_cents" text NOT NULL,
	"apr_bps" text NOT NULL,
	"reserve_susd_cents" text NOT NULL,
	"reserve_sats" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"total_value_usd_cents" text NOT NULL,
	"btc_exposure_bps" text NOT NULL,
	"susd_exposure_bps" text NOT NULL,
	"pnl_usd_cents" text NOT NULL,
	"captured_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settlements" (
	"id" text PRIMARY KEY NOT NULL,
	"batch_id" text NOT NULL,
	"clearing_price_usd_cents" text NOT NULL,
	"volume_sats" text NOT NULL,
	"settled_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stakes" (
	"id" text PRIMARY KEY NOT NULL,
	"pool_id" text NOT NULL,
	"staked_susd_cents" text NOT NULL,
	"rewards_susd_cents" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "susd_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"total_supply_susd_cents" text NOT NULL,
	"collateral_ratio_bps" text NOT NULL,
	"borrow_apr_bps" text NOT NULL,
	"savings_apr_bps" text NOT NULL,
	"peg_deviation_bps" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vaults" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"collateral_sats" text NOT NULL,
	"debt_susd_cents" text NOT NULL,
	"ltv_bps" text NOT NULL,
	"liq_price_usd_cents" text NOT NULL,
	"health" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
