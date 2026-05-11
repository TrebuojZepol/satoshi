import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb, getSchema } from "@/db";
import { newId } from "@/lib/server/id";
import { getOracleBtcUsdCents } from "@/lib/server/oracle";
import { SATS_PER_BTC } from "@/lib/money";

export async function GET() {
  const db = getDb();
  const { vaults } = getSchema();
  const rows = await db.select().from(vaults).orderBy(desc(vaults.createdAt));
  return NextResponse.json({ vaults: rows });
}

export async function POST(req: Request) {
  const db = getDb();
  const { vaults } = getSchema();
  let body: {
    label?: string;
    collateralSats?: string;
    debtSusdCents?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  let collateralSats: bigint;
  let debtSusdCents: bigint;
  try {
    collateralSats = BigInt(body.collateralSats ?? "");
    debtSusdCents = BigInt(body.debtSusdCents ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid amounts" }, { status: 400 });
  }
  if (collateralSats <= 0n || debtSusdCents < 0n) {
    return NextResponse.json({ error: "Invalid amounts" }, { status: 400 });
  }

  const id = newId("vault");
  const oracle = await getOracleBtcUsdCents();
  const collateralValueCents = (oracle * collateralSats) / SATS_PER_BTC;
  const ltvBps =
    collateralValueCents === 0n
      ? 0n
      : (debtSusdCents * 10_000n) / collateralValueCents;
  const liq = (oracle * 85n) / 100n;
  const health =
    ltvBps < 4500n ? "healthy" : ltvBps < 6500n ? "caution" : "at_risk";

  await db.insert(vaults).values({
    id,
    label: body.label?.trim() || "New vault",
    collateralSats: collateralSats.toString(),
    debtSusdCents: debtSusdCents.toString(),
    ltvBps: ltvBps.toString(),
    liquidationPriceUsdCents: liq.toString(),
    health,
    createdAt: new Date(),
  });

  const rows = await db.select().from(vaults).orderBy(desc(vaults.createdAt));
  return NextResponse.json({ id, vaults: rows });
}
