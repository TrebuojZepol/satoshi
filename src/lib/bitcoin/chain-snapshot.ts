import type { BlockStreamPayload } from "@/lib/bitcoin/block-stream-types";
import { getBlockState } from "@/lib/block-engine";
import { isBitcoinRpcMode } from "@/lib/server/satoshifi-env";
import { callBitcoinCoreRpc } from "@/lib/server/bitcoin-core-rpc";

const TARGET_BLOCK_MS = 600_000;

export async function getBlockStreamSnapshot(): Promise<BlockStreamPayload> {
  const now = Date.now();
  if (!isBitcoinRpcMode()) {
    const s = getBlockState(now);
    return {
      height: Number(s.height),
      nextBlockInMs: s.nextBlockInMs,
      progress: s.progress,
      blockTimeMs: s.blockTimeMs,
      serverTimeMs: now,
      source: "mock",
    };
  }

  const height = Number(await callBitcoinCoreRpc("getblockcount", []));
  const hash = (await callBitcoinCoreRpc("getblockhash", [height])) as string;
  const block = (await callBitcoinCoreRpc("getblock", [hash, 1])) as {
    time: number;
  };
  const blockTimeMs = block.time * 1000;
  const nextBlockAt = blockTimeMs + TARGET_BLOCK_MS;
  const nextBlockInMs = Math.max(0, nextBlockAt - now);
  const progress =
    TARGET_BLOCK_MS > 0
      ? Math.min(1, Math.max(0, 1 - nextBlockInMs / TARGET_BLOCK_MS))
      : 0;

  return {
    height,
    nextBlockInMs,
    progress,
    blockTimeMs: TARGET_BLOCK_MS,
    serverTimeMs: now,
    source: "rpc",
  };
}
