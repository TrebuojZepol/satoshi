import { describe, expect, it } from "vitest";
import {
  BITCOIN_RPC_PUBLIC_ALLOWLIST,
  isBitcoinRpcMethodAllowed,
} from "@/lib/server/bitcoin-rpc-allowlist";

describe("bitcoin RPC allowlist", () => {
  it("allows read-only style methods", () => {
    expect(isBitcoinRpcMethodAllowed("getblockcount")).toBe(true);
    expect(BITCOIN_RPC_PUBLIC_ALLOWLIST.has("estimatesmartfee")).toBe(true);
  });

  it("rejects privileged methods", () => {
    expect(isBitcoinRpcMethodAllowed("dumpprivkey")).toBe(false);
    expect(isBitcoinRpcMethodAllowed("sendrawtransaction")).toBe(false);
  });
});
