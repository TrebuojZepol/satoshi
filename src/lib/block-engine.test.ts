import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getBlockState,
  resetBlockEngineForTests,
  subscribeBlocks,
} from "@/lib/block-engine";
import { INITIAL_BLOCK_HEIGHT, MOCK_BLOCK_TIME_MS } from "@/lib/constants";

afterEach(() => {
  vi.useRealTimers();
  resetBlockEngineForTests(BigInt(INITIAL_BLOCK_HEIGHT), Date.now());
});

describe("block-engine", () => {
  it("returns height and countdown window", () => {
    const anchor = Date.now();
    resetBlockEngineForTests(890_000n, anchor);
    const s = getBlockState(anchor + 30_000);
    expect(Number(s.height)).toBe(890_000);
    expect(s.nextBlockInMs).toBeGreaterThan(0);
    expect(s.blockTimeMs).toBe(MOCK_BLOCK_TIME_MS);
  });

  it("increments height after block time", () => {
    const anchor = 1_000_000;
    resetBlockEngineForTests(890_000n, anchor);
    const s = getBlockState(anchor + MOCK_BLOCK_TIME_MS + 1);
    expect(s.height).toBe(890_001n);
  });

  it("notifies subscribers on new block", () => {
    const anchor = 5_000_000;
    resetBlockEngineForTests(1n, anchor);
    let hits = 0;
    const unsub = subscribeBlocks(() => {
      hits += 1;
    });
    getBlockState(anchor + MOCK_BLOCK_TIME_MS);
    expect(hits).toBeGreaterThan(0);
    unsub();
  });
});
