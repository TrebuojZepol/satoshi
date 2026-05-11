import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, getSchema, isPostgresDriver } from "@/db";
import { newId } from "@/lib/server/id";
import { computeBatchSettlement } from "@/lib/batch/settlement";
import { getOracleBtcUsdCents } from "@/lib/server/oracle";
import type { BatchOrderRow } from "@/lib/batch/pricing";

export async function POST() {
  const db = getDb();
  const { batchOrders, settlements } = getSchema();
  const orders = (await db
    .select()
    .from(batchOrders)
    .orderBy(desc(batchOrders.createdAt))) as BatchOrderRow[];
  const oracle = await getOracleBtcUsdCents();
  const plan = computeBatchSettlement(orders, Date.now(), oracle);

  const batchId = newId("batch");
  const sid = newId("set");

  if (isPostgresDriver()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle transaction typing tied to driver
    await db.transaction(async (tx: any) => {
      for (const u of plan.updates) {
        await tx
          .update(batchOrders)
          .set({
            amountSats: u.newAmountSats.toString(),
            status: u.status,
          })
          .where(eq(batchOrders.id, u.id));
      }
      await tx.insert(settlements).values({
        id: sid,
        batchId,
        clearingPriceUsdCents: plan.clearingPriceUsdCents.toString(),
        volumeSats: plan.matchedVolumeSats.toString(),
        settledAt: new Date(),
      });
    });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    db.transaction((tx: any) => {
      for (const u of plan.updates) {
        tx.update(batchOrders)
          .set({
            amountSats: u.newAmountSats.toString(),
            status: u.status,
          })
          .where(eq(batchOrders.id, u.id))
          .run();
      }
      tx.insert(settlements)
        .values({
          id: sid,
          batchId,
          clearingPriceUsdCents: plan.clearingPriceUsdCents.toString(),
          volumeSats: plan.matchedVolumeSats.toString(),
          settledAt: new Date(),
        })
        .run();
    });
  }

  const history = await db
    .select()
    .from(settlements)
    .orderBy(desc(settlements.settledAt));

  return NextResponse.json({
    settlement: {
      id: sid,
      batchId,
      clearingPriceUsdCents: plan.clearingPriceUsdCents.toString(),
      volumeSats: plan.matchedVolumeSats.toString(),
    },
    history,
  });
}
