import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb, getSchema } from "@/db";
import { newId } from "@/lib/server/id";
import { validateOrderInput } from "@/lib/server/order-validation";
import {
  type BatchOrderRow,
  estimateClearingPriceUsdCents,
} from "@/lib/batch/pricing";
import { estimateMatchedVolumeSats } from "@/lib/batch/settlement";
import { getOracleBtcUsdCents } from "@/lib/server/oracle";

function userKeyFromRequest(req: Request): string {
  const c = req.headers.get("cookie") ?? "";
  const m = c.match(/(?:^|;\s*)bv_wallet=([^;]+)/);
  if (m?.[1]) {
    return decodeURIComponent(m[1]);
  }
  return "anonymous";
}

export async function GET() {
  const db = getDb();
  const { batchOrders } = getSchema();
  const orders = (await db
    .select()
    .from(batchOrders)
    .orderBy(desc(batchOrders.createdAt))) as BatchOrderRow[];
  const oracle = await getOracleBtcUsdCents();
  const clearing = estimateClearingPriceUsdCents(orders, Date.now(), oracle);
  const matched = estimateMatchedVolumeSats(orders, Date.now(), oracle);
  const openOrders = orders.filter((o: BatchOrderRow) => o.status === "open");
  const filledOrders = orders
    .filter((o: BatchOrderRow) => o.status === "filled")
    .sort(
      (a: BatchOrderRow, b: BatchOrderRow) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  return NextResponse.json({
    orders,
    openOrders,
    filledOrders,
    clearingPriceUsdCents: clearing.toString(),
    matchedVolumeSats: matched.toString(),
  });
}

export async function POST(req: Request) {
  const db = getDb();
  const { batchOrders } = getSchema();
  const userKey = userKeyFromRequest(req);
  let body: {
    side?: string;
    amountSats?: string;
    limitPriceUsdCents?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const side = body.side === "buy" || body.side === "sell" ? body.side : null;
  if (!side) {
    return NextResponse.json({ error: "side must be buy or sell" }, { status: 400 });
  }
  let amountSats: bigint;
  let limitPriceUsdCents: bigint;
  try {
    amountSats = BigInt(body.amountSats ?? "");
    limitPriceUsdCents = BigInt(body.limitPriceUsdCents ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid numeric fields" }, { status: 400 });
  }

  const v = await validateOrderInput({
    side,
    amountSats,
    limitPriceUsdCents,
    userKey,
    db,
  });
  if (!v.ok) {
    return NextResponse.json({ error: v.message }, { status: 400 });
  }

  const id = newId("ord");
  await db.insert(batchOrders).values({
    id,
    userKey,
    side,
    amountSats: amountSats.toString(),
    limitPriceUsdCents: limitPriceUsdCents.toString(),
    status: "open",
    createdAt: new Date(),
  });

  const orders = (await db
    .select()
    .from(batchOrders)
    .orderBy(desc(batchOrders.createdAt))) as BatchOrderRow[];
  const openOrders = orders.filter((o: BatchOrderRow) => o.status === "open");
  const filledOrders = orders
    .filter((o: BatchOrderRow) => o.status === "filled")
    .sort(
      (a: BatchOrderRow, b: BatchOrderRow) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  return NextResponse.json({ id, orders, openOrders, filledOrders });
}
