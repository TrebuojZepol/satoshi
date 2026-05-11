const BASE_USD_CENTS = 98_500_00n;

export function getMockBtcUsdCents(nowMs: number = Date.now()): bigint {
  const wave = BigInt(Math.round(15_000 * Math.sin(nowMs / 120_000)));
  return BASE_USD_CENTS + wave;
}

function priceSource(): "mock" | "coingecko" {
  const s = process.env["BITVAULT_PRICE_SOURCE"]?.trim().toLowerCase();
  return s === "coingecko" ? "coingecko" : "mock";
}

/**
 * Live oracle when `BITVAULT_PRICE_SOURCE=coingecko` (server-side fetch);
 * otherwise deterministic mock (safe for tests / offline).
 */
export async function getOracleBtcUsdCents(nowMs?: number): Promise<bigint> {
  if (priceSource() === "coingecko") {
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
        { next: { revalidate: 45 } },
      );
      if (!res.ok) {
        throw new Error(`CoinGecko HTTP ${res.status}`);
      }
      const j = (await res.json()) as { bitcoin?: { usd?: number } };
      const usd = j.bitcoin?.usd;
      if (typeof usd === "number" && Number.isFinite(usd)) {
        return BigInt(Math.round(usd * 100));
      }
    } catch {
      /* fall through */
    }
  }
  return getMockBtcUsdCents(nowMs);
}
