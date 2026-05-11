import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb, getSchema } from "@/db";

export async function GET() {
  const db = getDb();
  const { liquidityPools, stakes } = getSchema();
  const pools = await db.select().from(liquidityPools).orderBy(desc(liquidityPools.id));
  const stakeRows = await db.select().from(stakes).orderBy(desc(stakes.updatedAt));
  return NextResponse.json({ pools, stakes: stakeRows });
}
