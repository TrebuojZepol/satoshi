import { NextResponse } from "next/server";

/**
 * When `BITVAULT_RPC_PROXY_SECRET` is set, POST /api/bitcoin/rpc must send either:
 * - `Authorization: Bearer <secret>`
 * - `x-bitvault-rpc-secret: <secret>`
 */
export function getBitcoinRpcProxySecret(): string | undefined {
  const s = process.env["BITVAULT_RPC_PROXY_SECRET"]?.trim();
  return s || undefined;
}

export function isRpcProxyAuthConfigured(): boolean {
  return Boolean(getBitcoinRpcProxySecret());
}

/** Returns a 401 Response if not authorized; otherwise null (caller continues). */
export function rpcProxyAuthDeniedResponse(req: Request): Response | null {
  const secret = getBitcoinRpcProxySecret();
  if (!secret) {
    return null;
  }
  const auth = req.headers.get("authorization");
  const header = req.headers.get("x-bitvault-rpc-secret");
  const bearer =
    auth?.startsWith("Bearer ") || auth?.startsWith("bearer ")
      ? auth.slice(7).trim()
      : null;
  const ok =
    (bearer !== null && bearer !== "" && bearer === secret) ||
    (header !== null && header !== "" && header === secret);
  if (ok) {
    return null;
  }
  return NextResponse.json(
    { error: "RPC proxy requires BITVAULT_RPC_PROXY_SECRET (Bearer or x-bitvault-rpc-secret)" },
    { status: 401 },
  );
}
