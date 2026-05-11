import { describe, expect, it } from "vitest";
import {
  formatSatsToBtc8,
  formatUsd2,
  parseBtcDecimalString,
  parseUsdDecimalToCents,
} from "@/lib/money";

describe("money", () => {
  it("parses BTC decimal to sats", () => {
    expect(parseBtcDecimalString("1")).toBe(100_000_000n);
    expect(parseBtcDecimalString("0.00000001")).toBe(1n);
    expect(parseBtcDecimalString("10.5")).toBe(1_050_000_000n);
  });

  it("formats sats with 8 decimals", () => {
    expect(formatSatsToBtc8(1n)).toBe("0.00000001");
    expect(formatSatsToBtc8(100_000_000n)).toBe("1.00000000");
  });

  it("parses USD to cents", () => {
    expect(parseUsdDecimalToCents("98.5")).toBe(9850n);
    expect(parseUsdDecimalToCents("$1,000.00")).toBe(100_000n);
  });

  it("formats cents to USD", () => {
    expect(formatUsd2(985000n)).toBe("$9850.00");
  });
});
