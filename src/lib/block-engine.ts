import { INITIAL_BLOCK_HEIGHT, MOCK_BLOCK_TIME_MS } from "@/lib/constants";

type Listener = () => void;

let height = BigInt(INITIAL_BLOCK_HEIGHT);
let anchorMs = Date.now();
const listeners = new Set<Listener>();

export function subscribeBlocks(cb: Listener) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function notify() {
  for (const l of listeners) {
    l();
  }
}

function rollForward(now: number) {
  const elapsed = now - anchorMs;
  if (elapsed >= MOCK_BLOCK_TIME_MS) {
    const n = Math.floor(elapsed / MOCK_BLOCK_TIME_MS);
    height += BigInt(n);
    anchorMs += n * MOCK_BLOCK_TIME_MS;
    notify();
  }
}

export function getBlockState(now: number = Date.now()) {
  rollForward(now);
  const elapsedInCycle = now - anchorMs;
  const nextBlockInMs = Math.max(0, MOCK_BLOCK_TIME_MS - elapsedInCycle);
  const progress = 1 - nextBlockInMs / MOCK_BLOCK_TIME_MS;
  return {
    height,
    nextBlockInMs,
    progress,
    blockTimeMs: MOCK_BLOCK_TIME_MS,
  };
}

export function resetBlockEngineForTests(h: bigint, anchor: number = Date.now()) {
  height = h;
  anchorMs = anchor;
  notify();
}
