export type BitcoinChainMode = "mock" | "rpc";

export function getBitcoinChainMode(): BitcoinChainMode {
  const v = process.env["BITVAULT_BITCOIN_MODE"]?.trim().toLowerCase();
  return v === "rpc" ? "rpc" : "mock";
}

export function isBitcoinRpcMode(): boolean {
  return getBitcoinChainMode() === "rpc";
}

export function getBitcoinRpcUrl(): string | undefined {
  const u = process.env["BITCOIN_RPC_URL"]?.trim();
  return u || undefined;
}

export function getBitcoinRpcAuth(): { user: string; password: string } {
  return {
    user: process.env["BITCOIN_RPC_USER"]?.trim() ?? "",
    password: process.env["BITCOIN_RPC_PASSWORD"]?.trim() ?? "",
  };
}

export function assertRpcConfiguredForProduction(): void {
  if (!isBitcoinRpcMode()) {
    return;
  }
  if (!getBitcoinRpcUrl()) {
    throw new Error(
      "BITVAULT_BITCOIN_MODE=rpc requires BITCOIN_RPC_URL (and usually BITCOIN_RPC_USER / BITCOIN_RPC_PASSWORD)",
    );
  }
}
