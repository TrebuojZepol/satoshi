import { describe, expect, it } from "vitest";
import { handleMockBitcoinRpcRequest } from "@/lib/bitcoin/mock-rpc";

describe("mock Bitcoin RPC", () => {
  it("returns block count", async () => {
    const res = await handleMockBitcoinRpcRequest(
      new Request("http://test.local/api/bitcoin/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "getblockcount" }),
      }),
    );
    expect(res.ok).toBe(true);
    const j = (await res.json()) as { result: number };
    expect(typeof j.result).toBe("number");
  });

  it("returns error for unknown method", async () => {
    const res = await handleMockBitcoinRpcRequest(
      new Request("http://test.local/api/bitcoin/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "unknown" }),
      }),
    );
    expect(res.status).toBe(404);
  });
});
