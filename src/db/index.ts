import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as sqliteSchema from "@/db/schema";
import * as pgSchema from "@/db/schema-pg";
import { ensureSchema } from "@/db/ensure-schema";

/** Drizzle Kit output for PostgreSQL (`drizzle.config.pg.ts` → `npm run db:generate:pg`). */
export const POSTGRES_MIGRATIONS_FOLDER = path.join(
  process.cwd(),
  "drizzle",
  "postgres",
);

export function hasBundledPostgresMigrations(): boolean {
  return fs.existsSync(path.join(POSTGRES_MIGRATIONS_FOLDER, "meta", "_journal.json"));
}

export type SchemaModule = typeof sqliteSchema | typeof pgSchema;

let sqlite: InstanceType<typeof Database> | null = null;
let pool: Pool | null = null;
let _db: BetterSQLite3Database<typeof sqliteSchema> | NodePgDatabase<typeof pgSchema> | null =
  null;
let activeSchema: SchemaModule = sqliteSchema;
let initDatabasePromise: Promise<void> | null = null;

/**
 * Active Drizzle client (better-sqlite3 or `pg`). The two drivers expose incompatible
 * TypeScript signatures for chained builders, so callers use `getSchema()` for table refs
 * and treat `Db` as the shared runtime surface.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle sqlite vs pg DB types cannot be unioned for `.select().from()`
export type Db = any;

/** When `DATABASE_URL` is set, the app uses PostgreSQL (after `initDatabase()`). */
export function isPostgresDriver(): boolean {
  return Boolean(process.env["DATABASE_URL"]?.trim());
}

export function getSchema(): SchemaModule {
  if (!_db) {
    getDb();
  }
  return activeSchema;
}

export function getDbPath() {
  if (process.env["BV_DB_PATH"]) {
    return process.env["BV_DB_PATH"];
  }
  return path.join(process.cwd(), "data", "bitvault.db");
}

function runSqliteMigrationsIfPresent(
  client: BetterSQLite3Database<typeof sqliteSchema>,
) {
  const folder = path.join(process.cwd(), "drizzle", "sqlite");
  if (fs.existsSync(path.join(folder, "meta", "_journal.json"))) {
    migrate(client, { migrationsFolder: folder });
  }
}

function createSqliteDb(): BetterSQLite3Database<typeof sqliteSchema> {
  const dir = path.dirname(getDbPath());
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  sqlite = new Database(getDbPath());
  sqlite.pragma("journal_mode = WAL");
  ensureSchema(sqlite);
  activeSchema = sqliteSchema;
  return drizzleSqlite(sqlite, { schema: sqliteSchema });
}

/**
 * Must be awaited once in Node before `getDb()` when `DATABASE_URL` is set.
 * For SQLite-only (local dev, Vitest), `getDb()` lazy-inits without this call.
 */
export async function initDatabase(): Promise<void> {
  if (initDatabasePromise) {
    return initDatabasePromise;
  }
  initDatabasePromise = (async () => {
    if (isPostgresDriver()) {
      const url = process.env["DATABASE_URL"]!.trim();
      pool = new Pool({ connectionString: url, max: 10 });
      _db = drizzlePg(pool, { schema: pgSchema });
      activeSchema = pgSchema;
      if (hasBundledPostgresMigrations()) {
        await migratePg(_db, { migrationsFolder: POSTGRES_MIGRATIONS_FOLDER });
      } else {
        console.warn(
          "[bitvault] PostgreSQL is configured but no bundled migrations were found under drizzle/postgres. Generate with `npm run db:generate:pg` and commit the output.",
        );
      }
      return;
    }
    if (!_db) {
      _db = createSqliteDb();
      runSqliteMigrationsIfPresent(_db);
    }
  })();
  return initDatabasePromise;
}

export function resetDbSingletonForTests() {
  if (sqlite) {
    try {
      sqlite.close();
    } catch {
      /* ignore */
    }
  }
  sqlite = null;
  if (pool) {
    void pool.end();
  }
  pool = null;
  _db = null;
  activeSchema = sqliteSchema;
  initDatabasePromise = null;
}

export function getDb(): Db {
  if (_db) {
    return _db;
  }
  if (isPostgresDriver()) {
    throw new Error(
      "DATABASE_URL is set but the database was not initialized. Await initDatabase() from instrumentation or scripts before calling getDb().",
    );
  }
  _db = createSqliteDb();
  runSqliteMigrationsIfPresent(_db);
  return _db;
}

export function runMigrations() {
  const db = getDb();
  if (!isPostgresDriver()) {
    runSqliteMigrationsIfPresent(db as BetterSQLite3Database<typeof sqliteSchema>);
  }
}
