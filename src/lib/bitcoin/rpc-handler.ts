import { NextResponse } from "next/server";
import { handleMockBitcoinRpcRequest } from "@/lib/bitcoin/mock-rpc";
import { isBitcoinRpcMethodAllowed } from "@/lib/server/bitcoin-rpc-allowlist";
import { callBitcoinCoreRpc } from "@/lib/server/bitcoin-core-rpc";
import { isBitcoinRpcMode } from "@/lib/server/satoshifi-env";
import { rpcProxyAuthDeniedResponse } from "@/lib/server/rpc-proxy-auth";

type RpcReq = { method?: string; params?: unknown[] };

export async function handleBitcoinRpcProxyRequest(req: Request): Promise<Response> {
  const denied = rpcProxyAuthDeniedResponse(req);
  if (denied) {
    return denied;
  }

  if (!isBitcoinRpcMode()) {
    return handleMockBitcoinRpcRequest(req);
  }

  let body: RpcReq;
  try {
    body = (await req.json()) as RpcReq;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const method = body.method;
  const params = body.params ?? [];
  if (!method || typeof method !== "string") {
    return NextResponse.json({ error: "Missing method" }, { status: 400 });
  }
  if (!isBitcoinRpcMethodAllowed(method)) {
    return NextResponse.json(
      {
        error: {
          code: -32601,
          message: `RPC method not allowed through proxy: ${method}`,
        },
      },
      { status: 403 },
    );
  }
  try {
    const result = await callBitcoinCoreRpc(method, params);
    return NextResponse.json({ result, error: null });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "RPC failure";
    return NextResponse.json(
      { error: { code: -1, message: msg } },
      { status: 502 },
    );
  }
}
