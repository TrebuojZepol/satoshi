import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb, getSchema } from "@/db";

export async function GET() {
  const db = getDb();
  const { settlements } = getSchema();
  const rows = await db.select().from(settlements).orderBy(desc(settlements.settledAt));
  return NextResponse.json({ settlements: rows });
}
