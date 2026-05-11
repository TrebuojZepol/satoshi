import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb, getSchema } from "@/db";
import { computeBatchSettlement } from "@/lib/batch/settlement";
import {
  buildRegtestSettlementPsbtBase64,
  parsePsbtUtxoFromEnv,
} from "@/lib/bitcoin/settlement-psbt";
import { getOracleBtcUsdCents } from "@/lib/server/oracle";
import type { BatchOrderRow } from "@/lib/batch/pricing";

async function readFeeSats(req: Request): Promise<number> {
  let feeSats = 500;
  try {
    const body = (await req.json()) as { feeSats?: number };
    if (typeof body.feeSats === "number" && body.feeSats > 0) {
      feeSats = Math.floor(body.feeSats);
    }
  } catch {
    /* no JSON body */
  }
  return feeSats;
}

export async function POST(req: Request) {
  const db = getDb();
  const { batchOrders } = getSchema();
  const orders = (await db
    .select()
    .from(batchOrders)
    .orderBy(desc(batchOrders.createdAt))) as BatchOrderRow[];
  const oracle = await getOracleBtcUsdCents();
  const plan = computeBatchSettlement(orders, Date.now(), oracle);

  const feeSats = await readFeeSats(req);

  if (!parsePsbtUtxoFromEnv()) {
    return NextResponse.json({
      enabled: false,
      plan: {
        matchedVolumeSats: plan.matchedVolumeSats.toString(),
        clearingPriceUsdCents: plan.clearingPriceUsdCents.toString(),
        updateCount: plan.updates.length,
      },
      message:
        "Set BITVAULT_PSBT_UTXO (JSON: txid, vout, value, wif) and BITVAULT_BITCOIN_NETWORK=regtest|testnet|mainnet to build a signable PSBT for your funded UTXO.",
    });
  }

  try {
    const { psbtBase64, changeAddress } = buildRegtestSettlementPsbtBase64({
      feeSats,
    });
    return NextResponse.json({
      enabled: true,
      plan: {
        matchedVolumeSats: plan.matchedVolumeSats.toString(),
        clearingPriceUsdCents: plan.clearingPriceUsdCents.toString(),
        updateCount: plan.updates.length,
      },
      psbtBase64,
      changeAddress,
      feeSats,
      hint: "Sign with UniSat (signPsbt) then broadcast (pushPsbt) on regtest.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "PSBT build failed";
    return NextResponse.json({ enabled: false, error: msg, plan }, { status: 400 });
  }
}
