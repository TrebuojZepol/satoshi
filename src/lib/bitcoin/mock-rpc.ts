import { NextResponse } from "next/server";
import { getBlockState } from "@/lib/block-engine";

type RpcReq = { method?: string; params?: unknown[] };

export async function handleMockBitcoinRpcRequest(req: Request): Promise<Response> {
  let body: RpcReq;
  try {
    body = (await req.json()) as RpcReq;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const method = body.method;
  const params = body.params ?? [];

  if (method === "getblockcount") {
    const { height } = getBlockState();
    return NextResponse.json({ result: Number(height), error: null });
  }
  if (method === "getblockhash") {
    const h = Number(params[0]);
    if (!Number.isFinite(h)) {
      return NextResponse.json(
        { error: { code: -5, message: "Invalid height" } },
        { status: 400 },
      );
    }
    return NextResponse.json({
      result: `0000mock${h.toString(16).padStart(56, "0")}`,
      error: null,
    });
  }
  if (method === "getblock") {
    const hash = String(params[0] ?? "");
    const verbosity = Number(params[1] ?? 1);
    const { height } = getBlockState();
    if (verbosity <= 0) {
      return NextResponse.json({ result: "0f00mockhex", error: null });
    }
    return NextResponse.json({
      result: {
        hash,
        height: Number(height),
        version: 2,
        time: Math.floor(Date.now() / 1000),
        tx: ["mock_coinbase_txid"],
      },
      error: null,
    });
  }
  if (method === "estimatesmartfee") {
    return NextResponse.json({
      result: { feerate: 0.00002, blocks: 6 },
      error: null,
    });
  }
  return NextResponse.json(
    { error: { code: -32601, message: `Method not found: ${String(method)}` } },
    { status: 404 },
  );
}
