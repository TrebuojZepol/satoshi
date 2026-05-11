export async function register() {
  if (process.env["NEXT_RUNTIME"] === "nodejs") {
    const { getBitcoinRpcUrl, isBitcoinRpcMode } = await import(
      "@/lib/server/bitvault-env"
    );
    const { isRpcProxyAuthConfigured } = await import("@/lib/server/rpc-proxy-auth");
    if (isBitcoinRpcMode() && !getBitcoinRpcUrl()) {
      console.warn(
        "[bitvault] BITVAULT_BITCOIN_MODE=rpc but BITCOIN_RPC_URL is not set — block stream and RPC proxy will fail.",
      );
    }
    if (
      process.env["NODE_ENV"] === "production" &&
      isBitcoinRpcMode() &&
      !isRpcProxyAuthConfigured()
    ) {
      console.warn(
        "[bitvault] Production + BITVAULT_BITCOIN_MODE=rpc without BITVAULT_RPC_PROXY_SECRET — the HTTP RPC proxy is open to anyone who can reach this app. Set a secret and send Authorization: Bearer … from clients.",
      );
    }
    const { initDatabase, getDb } = await import("@/db");
    await initDatabase();
    getDb();
  }
}
