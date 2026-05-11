/**
 * Verifies DATABASE_URL connectivity, Drizzle migrator, and a trivial query.
 * Use locally with Docker Postgres or in CI (see .github/workflows/ci.yml).
 *
 * Requiere: DATABASE_URL (no uses BV_DB_PATH a la vez para este script).
 */
import { sql } from "drizzle-orm";
import {
  getDb,
  initDatabase,
  resetDbSingletonForTests,
} from "../src/db/index";

async function main() {
  const url = process.env["DATABASE_URL"]?.trim();
  if (!url) {
    console.error(
      "[db:verify:pg] Falta DATABASE_URL. Ejemplo: postgresql://bitvault:bitvault@127.0.0.1:5432/bitvault",
    );
    process.exit(1);
  }
  if (process.env["BV_DB_PATH"]?.trim()) {
    console.warn(
      "[db:verify:pg] AVISO: BV_DB_PATH está definido; elimínalo para forzar solo Postgres.",
    );
  }

  try {
    resetDbSingletonForTests();
    await initDatabase();
    const db = getDb();
    await db.execute(sql`select 1 as ok`);
    console.log(
      "[db:verify:pg] OK — conexión Postgres, migraciones aplicadas y consulta mínima correcta.",
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[db:verify:pg] Error:", msg);
    process.exit(1);
  } finally {
    resetDbSingletonForTests();
  }
}

void main();
