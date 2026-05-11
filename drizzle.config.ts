import { defineConfig } from "drizzle-kit";

/**
 * SQLite (local dev / Vitest). File DDL is still applied via `ensure-schema.ts` on open;
 * use this config to generate optional SQL migrations into `./drizzle/sqlite` when evolving SQLite.
 *
 * PostgreSQL (production): use `drizzle.config.pg.ts` and `npm run db:generate:pg`.
 */
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle/sqlite",
  dialect: "sqlite",
  dbCredentials: { url: "file:./data/satoshifi.db" },
});
