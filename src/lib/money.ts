export const SATS_PER_BTC = 100_000_000n;

export function parseBtcDecimalString(input: string): bigint {
  const trimmed = input.trim();
  if (trimmed === "" || trimmed === ".") {
    throw new Error("Invalid amount");
  }
  const neg = trimmed.startsWith("-");
  const s = neg ? trimmed.slice(1) : trimmed;
  const parts = s.split(".");
  const wholeRaw = parts[0] ?? "";
  const fracRaw = parts[1] ?? "";
  if (!/^\d*$/.test(wholeRaw) || !/^\d*$/.test(fracRaw)) {
    throw new Error("Invalid amount");
  }
  const whole = BigInt(wholeRaw === "" ? "0" : wholeRaw);
  const fracPadded = (fracRaw + "00000000").slice(0, 8);
  const frac = BigInt(fracPadded === "" ? "0" : fracPadded);
  const v = whole * SATS_PER_BTC + frac;
  return neg ? -v : v;
}

export function formatSatsToBtc8(sats: bigint): string {
  const neg = sats < 0n;
  const v = neg ? -sats : sats;
  const whole = v / SATS_PER_BTC;
  const frac = v % SATS_PER_BTC;
  const fracStr = frac.toString().padStart(8, "0");
  const out = `${whole.toString()}.${fracStr}`;
  return neg ? `-${out}` : out;
}

export function formatUsd2(cents: bigint): string {
  const neg = cents < 0n;
  const v = neg ? -cents : cents;
  const d = v / 100n;
  const c = v % 100n;
  const out = `${d.toString()}.${c.toString().padStart(2, "0")}`;
  return neg ? `-$${out}` : `$${out}`;
}

export function parseUsdDecimalToCents(input: string): bigint {
  const t = input.trim().replace(/[$,]/g, "");
  if (t === "" || t === ".") {
    throw new Error("Invalid USD amount");
  }
  const neg = t.startsWith("-");
  const s = neg ? t.slice(1) : t;
  const parts = s.split(".");
  const wholeRaw = parts[0] ?? "";
  const fracRaw = parts[1] ?? "";
  if (!/^\d*$/.test(wholeRaw) || !/^\d*$/.test(fracRaw)) {
    throw new Error("Invalid USD amount");
  }
  const whole = BigInt(wholeRaw === "" ? "0" : wholeRaw);
  const fracPadded = (fracRaw + "00").slice(0, 2);
  const frac = BigInt(fracPadded === "" ? "0" : fracPadded);
  const v = whole * 100n + frac;
  return neg ? -v : v;
}
