import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, getSchema } from "@/db";
import { getOracleBtcUsdCents } from "@/lib/server/oracle";
import { SATS_PER_BTC } from "@/lib/money";

type Params = { params: Promise<{ id: string }> };

async function recompute(
  collateralSats: bigint,
  debtSusdCents: bigint,
): Promise<{
  ltvBps: bigint;
  liquidationPriceUsdCents: bigint;
  health: string;
}> {
  const oracle = await getOracleBtcUsdCents();
  const collateralValueCents = (oracle * collateralSats) / SATS_PER_BTC;
  const ltvBps =
    collateralValueCents === 0n
      ? 0n
      : (debtSusdCents * 10_000n) / collateralValueCents;
  const liquidationPriceUsdCents = (oracle * 85n) / 100n;
  const health =
    ltvBps < 4500n ? "healthy" : ltvBps < 6500n ? "caution" : "at_risk";
  return { ltvBps, liquidationPriceUsdCents, health };
}

export async function PATCH(req: Request, ctx: Params) {
  const { id } = await ctx.params;
  const db = getDb();
  const { vaults } = getSchema();
  let body: { action?: string; amountSusdCents?: string; amountSats?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const found = await db.select().from(vaults).where(eq(vaults.id, id)).limit(1);
  const row = found[0];
  if (!row) {
    return NextResponse.json({ error: "Vault not found" }, { status: 404 });
  }
  let collateral = BigInt(row.collateralSats);
  let debt = BigInt(row.debtSusdCents);

  if (body.action === "borrow") {
    const add = BigInt(body.amountSusdCents ?? "");
    if (add <= 0n) {
      return NextResponse.json({ error: "Invalid borrow amount" }, { status: 400 });
    }
    debt += add;
  } else if (body.action === "repay") {
    const sub = BigInt(body.amountSusdCents ?? "");
    if (sub <= 0n) {
      return NextResponse.json({ error: "Invalid repay amount" }, { status: 400 });
    }
    debt = debt > sub ? debt - sub : 0n;
  } else if (body.action === "add_collateral") {
    const add = BigInt(body.amountSats ?? "");
    if (add <= 0n) {
      return NextResponse.json({ error: "Invalid collateral" }, { status: 400 });
    }
    collateral += add;
  } else if (body.action === "liquidate") {
    collateral = (collateral * 92n) / 100n;
    debt = 0n;
    const oracle = await getOracleBtcUsdCents();
    const updated = {
      ltvBps: 0n,
      liquidationPriceUsdCents: oracle,
      health: "liquidated",
    };
    await db
      .update(vaults)
      .set({
        collateralSats: collateral.toString(),
        debtSusdCents: debt.toString(),
        ltvBps: updated.ltvBps.toString(),
        liquidationPriceUsdCents: updated.liquidationPriceUsdCents.toString(),
        health: updated.health,
      })
      .where(eq(vaults.id, id));
    const rowOut = await db.select().from(vaults).where(eq(vaults.id, id)).limit(1);
    return NextResponse.json({ vault: rowOut[0] ?? null });
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const { ltvBps, liquidationPriceUsdCents, health } = await recompute(
    collateral,
    debt,
  );
  await db
    .update(vaults)
    .set({
      collateralSats: collateral.toString(),
      debtSusdCents: debt.toString(),
      ltvBps: ltvBps.toString(),
      liquidationPriceUsdCents: liquidationPriceUsdCents.toString(),
      health,
    })
    .where(eq(vaults.id, id));

  const updated = await db.select().from(vaults).where(eq(vaults.id, id)).limit(1);
  return NextResponse.json({ vault: updated[0] ?? null });
}
