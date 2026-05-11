import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, getSchema } from "@/db";

export async function GET() {
  const db = getDb();
  const { susdMetrics } = getSchema();
  const rows = await db
    .select()
    .from(susdMetrics)
    .orderBy(desc(susdMetrics.updatedAt))
    .limit(1);
  const row = rows[0] ?? null;
  return NextResponse.json({ metrics: row });
}

export async function PATCH(req: Request) {
  const db = getDb();
  const { susdMetrics } = getSchema();
  let body: { borrowAprBps?: string; savingsAprBps?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const rows = await db
    .select()
    .from(susdMetrics)
    .orderBy(desc(susdMetrics.updatedAt))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "No metrics" }, { status: 404 });
  }
  const borrow = body.borrowAprBps ? BigInt(body.borrowAprBps) : BigInt(row.borrowAprBps);
  const savings = body.savingsAprBps
    ? BigInt(body.savingsAprBps)
    : BigInt(row.savingsAprBps);
  await db
    .update(susdMetrics)
    .set({
      borrowAprBps: borrow.toString(),
      savingsAprBps: savings.toString(),
      updatedAt: new Date(),
    })
    .where(eq(susdMetrics.id, row.id));
  const updatedRows = await db
    .select()
    .from(susdMetrics)
    .where(eq(susdMetrics.id, row.id))
    .limit(1);
  return NextResponse.json({ metrics: updatedRows[0] ?? null });
}
