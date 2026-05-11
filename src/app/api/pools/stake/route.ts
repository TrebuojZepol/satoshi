import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, getSchema } from "@/db";
import { newId } from "@/lib/server/id";

export async function POST(req: Request) {
  const db = getDb();
  const { stakes } = getSchema();
  let body: { poolId?: string; amountSusdCents?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const poolId = body.poolId ?? "";
  let amount: bigint;
  try {
    amount = BigInt(body.amountSusdCents ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  if (!poolId || amount <= 0n) {
    return NextResponse.json({ error: "Invalid stake" }, { status: 400 });
  }

  const existingRows = await db
    .select()
    .from(stakes)
    .where(eq(stakes.poolId, poolId))
    .limit(1);
  const existing = existingRows[0];
  if (existing) {
    const next = BigInt(existing.stakedSusdCents) + amount;
    await db
      .update(stakes)
      .set({ stakedSusdCents: next.toString(), updatedAt: new Date() })
      .where(eq(stakes.id, existing.id));
  } else {
    await db.insert(stakes).values({
      id: newId("stake"),
      poolId,
      stakedSusdCents: amount.toString(),
      rewardsSusdCents: "0",
      updatedAt: new Date(),
    });
  }

  const stakeRows = await db.select().from(stakes);
  return NextResponse.json({ stakes: stakeRows });
}
