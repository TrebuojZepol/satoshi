import { defineConfig } from "drizzle-kit";

/**
 * PostgreSQL migrations (production / DATABASE_URL).
 * Generate: `npm run db:generate:pg -- --name descriptive_change`
 * Introspect/push against a real DB: set `DATABASE_URL` in the environment.
 */
export default defineConfig({
  schema: "./src/db/schema-pg.ts",
  out: "./drizzle/postgres",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env["DATABASE_URL"]?.trim() ??
      "postgresql://satoshifi:satoshifi@127.0.0.1:5432/satoshifi",
  },
  strict: true,
});
