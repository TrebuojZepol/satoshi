import * as ecc from "@bitcoinerlab/secp256k1";
import * as bitcoin from "bitcoinjs-lib";
import { ECPairFactory } from "ecpair";

let eccReady = false;

function ensureEcc(): void {
  if (!eccReady) {
    // @bitcoinerlab/secp256k1 implements the TinySecp256k1 surface bitcoinjs-lib expects.
    bitcoin.initEccLib(ecc as Parameters<typeof bitcoin.initEccLib>[0]);
    eccReady = true;
  }
}

export type PsbtUtxoConfig = {
  txid: string;
  vout: number;
  value: number;
  wif: string;
};

export function parsePsbtUtxoFromEnv(): PsbtUtxoConfig | null {
  const raw = process.env["BITVAULT_PSBT_UTXO"]?.trim();
  if (!raw) {
    return null;
  }
  try {
    const j = JSON.parse(raw) as PsbtUtxoConfig;
    if (
      typeof j.txid !== "string" ||
      j.txid.length !== 64 ||
      typeof j.vout !== "number" ||
      typeof j.value !== "number" ||
      typeof j.wif !== "string"
    ) {
      return null;
    }
    return j;
  } catch {
    return null;
  }
}

export function resolveBitcoinNetwork(): bitcoin.networks.Network {
  const n = process.env["BITVAULT_BITCOIN_NETWORK"]?.trim().toLowerCase();
  if (n === "mainnet") {
    return bitcoin.networks.bitcoin;
  }
  if (n === "testnet") {
    return bitcoin.networks.testnet;
  }
  return bitcoin.networks.regtest;
}

/**
 * Builds a single-input PSBT paying back to the key's own native segwit address,
 * minus `feeSats`. Requires a real UTXO owned by `wif` (regtest/testnet only).
 */
export function buildRegtestSettlementPsbtBase64(params: {
  feeSats: number;
}): { psbtBase64: string; changeAddress: string } {
  ensureEcc();
  const utxo = parsePsbtUtxoFromEnv();
  if (!utxo) {
    throw new Error("BITVAULT_PSBT_UTXO is not configured");
  }
  if (params.feeSats < 1 || params.feeSats >= utxo.value) {
    throw new Error("Invalid feeSats");
  }

  const network = resolveBitcoinNetwork();
  const ECPair = ECPairFactory(ecc as Parameters<typeof ECPairFactory>[0]);
  const keyPair = ECPair.fromWIF(utxo.wif, network);
  const p2wpkh = bitcoin.payments.p2wpkh({
    pubkey: keyPair.publicKey,
    network,
  });
  if (!p2wpkh.output || !p2wpkh.address) {
    throw new Error("Failed to derive p2wpkh");
  }

  const outValue = BigInt(utxo.value - params.feeSats);
  if (outValue <= 546n) {
    throw new Error("Output would be dust; increase UTXO value or lower fee");
  }

  const psbt = new bitcoin.Psbt({ network });
  psbt.addInput({
    hash: utxo.txid,
    index: utxo.vout,
    witnessUtxo: {
      script: p2wpkh.output,
      value: BigInt(utxo.value),
    },
  });
  psbt.addOutput({
    address: p2wpkh.address,
    value: outValue,
  });

  return { psbtBase64: psbt.toBase64(), changeAddress: p2wpkh.address };
}
