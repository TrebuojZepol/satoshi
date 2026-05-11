import { getBitcoinRpcAuth, getBitcoinRpcUrl } from "@/lib/server/bitvault-env";

type JsonRpcResponse = {
  result?: unknown;
  error?: { code: number; message: string };
  id: string | number;
};

export async function callBitcoinCoreRpc(
  method: string,
  params: unknown[] = [],
): Promise<unknown> {
  const url = getBitcoinRpcUrl();
  if (!url) {
    throw new Error("BITCOIN_RPC_URL is not configured");
  }
  const { user, password } = getBitcoinRpcAuth();
  const id = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(user || password
        ? {
            Authorization: `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`,
          }
        : {}),
    },
    body: JSON.stringify({
      jsonrpc: "1.0",
      id,
      method,
      params,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Bitcoin RPC HTTP ${res.status}: ${await res.text()}`);
  }
  const body = (await res.json()) as JsonRpcResponse;
  if (body.error) {
    throw new Error(body.error.message || "Bitcoin RPC error");
  }
  return body.result;
}
