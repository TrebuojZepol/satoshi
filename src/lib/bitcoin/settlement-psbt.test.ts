/** @vitest-environment node */
import * as ecc from "@bitcoinerlab/secp256k1";
import * as bitcoin from "bitcoinjs-lib";
import { ECPairFactory } from "ecpair";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildRegtestSettlementPsbtBase64,
  parsePsbtUtxoFromEnv,
  resolveBitcoinNetwork,
} from "./settlement-psbt";

function initEccOnce(): void {
  bitcoin.initEccLib(ecc as Parameters<typeof bitcoin.initEccLib>[0]);
}

describe("parsePsbtUtxoFromEnv", () => {
  afterEach(() => {
    delete process.env["BITVAULT_PSBT_UTXO"];
  });

  it("returns null when unset", () => {
    expect(parsePsbtUtxoFromEnv()).toBeNull();
  });

  it("parses valid JSON", () => {
    process.env["BITVAULT_PSBT_UTXO"] = JSON.stringify({
      txid: "a".repeat(64),
      vout: 0,
      value: 100_000,
      wif: "cRg9test",
    });
    expect(parsePsbtUtxoFromEnv()).toEqual({
      txid: "a".repeat(64),
      vout: 0,
      value: 100_000,
      wif: "cRg9test",
    });
  });

  it("rejects invalid txid length", () => {
    process.env["BITVAULT_PSBT_UTXO"] = JSON.stringify({
      txid: "ab",
      vout: 0,
      value: 1,
      wif: "x",
    });
    expect(parsePsbtUtxoFromEnv()).toBeNull();
  });
});

describe("resolveBitcoinNetwork", () => {
  afterEach(() => {
    delete process.env["BITVAULT_BITCOIN_NETWORK"];
  });

  it("defaults to regtest", () => {
    expect(resolveBitcoinNetwork()).toBe(bitcoin.networks.regtest);
  });

  it("honors mainnet and testnet", () => {
    process.env["BITVAULT_BITCOIN_NETWORK"] = "mainnet";
    expect(resolveBitcoinNetwork()).toBe(bitcoin.networks.bitcoin);
    process.env["BITVAULT_BITCOIN_NETWORK"] = "testnet";
    expect(resolveBitcoinNetwork()).toBe(bitcoin.networks.testnet);
  });
});

describe("buildRegtestSettlementPsbtBase64", () => {
  beforeEach(() => {
    initEccOnce();
    const ECPair = ECPairFactory(ecc as Parameters<typeof ECPairFactory>[0]);
    const kp = ECPair.makeRandom({ network: bitcoin.networks.regtest });
    process.env["BITVAULT_PSBT_UTXO"] = JSON.stringify({
      txid: "b".repeat(64),
      vout: 0,
      value: 200_000,
      wif: kp.toWIF(),
    });
    process.env["BITVAULT_BITCOIN_NETWORK"] = "regtest";
  });

  afterEach(() => {
    delete process.env["BITVAULT_PSBT_UTXO"];
    delete process.env["BITVAULT_BITCOIN_NETWORK"];
  });

  it("returns base64 PSBT and change address", () => {
    const { psbtBase64, changeAddress } = buildRegtestSettlementPsbtBase64({
      feeSats: 500,
    });
    expect(changeAddress).toMatch(/^bcrt1|^tb1/);
    expect(psbtBase64.length).toBeGreaterThan(20);
    const decoded = bitcoin.Psbt.fromBase64(psbtBase64, {
      network: bitcoin.networks.regtest,
    });
    expect(decoded.data.inputs).toHaveLength(1);
    expect(decoded.data.outputs).toHaveLength(1);
  });

  it("throws on excessive fee", () => {
    expect(() =>
      buildRegtestSettlementPsbtBase64({ feeSats: 200_000 }),
    ).toThrow(/Invalid feeSats/);
  });
});
