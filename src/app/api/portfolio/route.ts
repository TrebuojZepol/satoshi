import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb, getSchema } from "@/db";

export async function GET() {
  const db = getDb();
  const { portfolioSnapshots } = getSchema();
  const rows = await db
    .select()
    .from(portfolioSnapshots)
    .orderBy(desc(portfolioSnapshots.capturedAt))
    .limit(64);
  return NextResponse.json({ snapshots: rows });
}
