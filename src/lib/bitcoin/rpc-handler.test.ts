import { afterEach, describe, expect, it } from "vitest";
import { handleBitcoinRpcProxyRequest } from "./rpc-handler";

describe("handleBitcoinRpcProxyRequest", () => {
  afterEach(() => {
    delete process.env["BITVAULT_RPC_PROXY_SECRET"];
    delete process.env["BITVAULT_BITCOIN_MODE"];
  });

  it("returns 401 when proxy secret is set but request is unauthenticated", async () => {
    process.env["BITVAULT_RPC_PROXY_SECRET"] = "s3cret";
    process.env["BITVAULT_BITCOIN_MODE"] = "mock";
    const res = await handleBitcoinRpcProxyRequest(
      new Request("http://localhost/api/bitcoin/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "getblockcount", params: [] }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("allows mock RPC when Bearer matches secret", async () => {
    process.env["BITVAULT_RPC_PROXY_SECRET"] = "s3cret";
    process.env["BITVAULT_BITCOIN_MODE"] = "mock";
    const res = await handleBitcoinRpcProxyRequest(
      new Request("http://localhost/api/bitcoin/rpc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer s3cret",
        },
        body: JSON.stringify({ method: "getblockcount", params: [] }),
      }),
    );
    expect(res.ok).toBe(true);
    const j = (await res.json()) as { result?: unknown };
    expect(j.result).toBeDefined();
  });
});
