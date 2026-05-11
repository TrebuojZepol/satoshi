import { NextResponse } from "next/server";
import { getOracleBtcUsdCents } from "@/lib/server/oracle";

export async function GET() {
  const now = Date.now();
  const btcUsdCents = await getOracleBtcUsdCents(now);
  return NextResponse.json({
    btcUsdCents: btcUsdCents.toString(),
    serverTimeMs: now,
  });
}
