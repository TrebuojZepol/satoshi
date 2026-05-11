import { describe, expect, it } from "vitest";
import type { BatchOrderRow } from "@/lib/batch/pricing";
import { computeBatchSettlement } from "@/lib/batch/settlement";

function row(p: Partial<BatchOrderRow> & Pick<BatchOrderRow, "id" | "side">): BatchOrderRow {
  return {
    id: p.id,
    userKey: p.userKey ?? "u",
    side: p.side,
    amountSats: p.amountSats ?? "100000000",
    limitPriceUsdCents: p.limitPriceUsdCents ?? "9850000",
    status: p.status ?? "open",
    createdAt: p.createdAt ?? new Date("2026-01-01T00:00:00Z"),
  };
}

describe("computeBatchSettlement", () => {
  it("fills nothing when only buys exist", () => {
    const plan = computeBatchSettlement([
      row({ id: "b1", side: "buy", amountSats: "1000000" }),
    ]);
    expect(plan.matchedVolumeSats).toBe(0n);
    expect(plan.updates).toHaveLength(0);
  });

  it("fills FIFO at clearing when both sides cross", () => {
    const plan = computeBatchSettlement(
      [
        row({
          id: "b1",
          side: "buy",
          amountSats: "3000000",
          limitPriceUsdCents: "10000000",
          createdAt: new Date("2026-01-01T00:00:00Z"),
        }),
        row({
          id: "s1",
          side: "sell",
          amountSats: "1000000",
          limitPriceUsdCents: "9000000",
          createdAt: new Date("2026-01-01T00:01:00Z"),
        }),
        row({
          id: "s2",
          side: "sell",
          amountSats: "5000000",
          limitPriceUsdCents: "9500000",
          createdAt: new Date("2026-01-01T00:02:00Z"),
        }),
      ],
      Date.now(),
    );
    expect(plan.matchedVolumeSats).toBe(3_000_000n);
    const b1 = plan.updates.find((u) => u.id === "b1");
    expect(b1?.status).toBe("filled");
    expect(b1?.newAmountSats).toBe(0n);
    const s1 = plan.updates.find((u) => u.id === "s1");
    expect(s1?.status).toBe("filled");
    expect(s1?.newAmountSats).toBe(0n);
    const s2 = plan.updates.find((u) => u.id === "s2");
    expect(s2?.status).toBe("open");
    expect(s2?.newAmountSats).toBe(3_000_000n);
  });
});
