import { afterEach, describe, expect, it } from "vitest";
import {
  getBitcoinRpcProxySecret,
  rpcProxyAuthDeniedResponse,
} from "./rpc-proxy-auth";

describe("rpcProxyAuthDeniedResponse", () => {
  afterEach(() => {
    delete process.env["BITVAULT_RPC_PROXY_SECRET"];
  });

  it("allows any request when secret is unset", () => {
    expect(rpcProxyAuthDeniedResponse(new Request("http://localhost/"))).toBeNull();
  });

  it("rejects when secret is set but headers missing", () => {
    process.env["BITVAULT_RPC_PROXY_SECRET"] = "abc123";
    const res = rpcProxyAuthDeniedResponse(new Request("http://localhost/"));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });

  it("accepts Authorization Bearer", () => {
    process.env["BITVAULT_RPC_PROXY_SECRET"] = "abc123";
    const res = rpcProxyAuthDeniedResponse(
      new Request("http://localhost/", {
        headers: { Authorization: "Bearer abc123" },
      }),
    );
    expect(res).toBeNull();
  });

  it("accepts x-satoshifi-rpc-secret", () => {
    process.env["BITVAULT_RPC_PROXY_SECRET"] = "abc123";
    const res = rpcProxyAuthDeniedResponse(
      new Request("http://localhost/", {
        headers: { "x-satoshifi-rpc-secret": "abc123" },
      }),
    );
    expect(res).toBeNull();
  });

  it("accepts legacy x-bitvault-rpc-secret", () => {
    process.env["BITVAULT_RPC_PROXY_SECRET"] = "abc123";
    const res = rpcProxyAuthDeniedResponse(
      new Request("http://localhost/", {
        headers: { "x-bitvault-rpc-secret": "abc123" },
      }),
    );
    expect(res).toBeNull();
  });

  it("getBitcoinRpcProxySecret trims whitespace", () => {
    process.env["BITVAULT_RPC_PROXY_SECRET"] = "  xyz  ";
    expect(getBitcoinRpcProxySecret()).toBe("xyz");
  });
});
