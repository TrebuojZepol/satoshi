/**
 * Methods the public HTTP proxy may forward to your node.
 * Extend intentionally — never proxy wallet-privileged calls without auth.
 */
export const BITCOIN_RPC_PUBLIC_ALLOWLIST = new Set([
  "getblockchaininfo",
  "getblockcount",
  "getblockhash",
  "getblock",
  "getblockheader",
  "getblockstats",
  "getbestblockhash",
  "estimatesmartfee",
  "getnetworkinfo",
  "validateaddress",
  "getrawmempool",
]);

export function isBitcoinRpcMethodAllowed(method: string): boolean {
  return BITCOIN_RPC_PUBLIC_ALLOWLIST.has(method);
}
