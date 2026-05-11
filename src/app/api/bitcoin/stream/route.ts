import type { BlockStreamPayload } from "@/lib/bitcoin/block-stream-types";
import { getBlockStreamSnapshot } from "@/lib/bitcoin/chain-snapshot";
import { subscribeBlocks } from "@/lib/block-engine";
import { isBitcoinRpcMode } from "@/lib/server/bitvault-env";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | undefined;
  let unsub: (() => void) | undefined;
  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        void (async () => {
          try {
            const payload = await getBlockStreamSnapshot();
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
            );
          } catch (e) {
            const msg = e instanceof Error ? e.message : "block snapshot failed";
            const fallback: BlockStreamPayload = {
              height: 0,
              nextBlockInMs: 0,
              progress: 0,
              blockTimeMs: 600_000,
              serverTimeMs: Date.now(),
              source: isBitcoinRpcMode() ? "rpc" : "mock",
              error: msg,
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(fallback)}\n\n`),
            );
          }
        })();
      };
      send();
      if (!isBitcoinRpcMode()) {
        unsub = subscribeBlocks(send);
      }
      interval = setInterval(send, isBitcoinRpcMode() ? 3000 : 1000);
    },
    cancel() {
      if (interval) {
        clearInterval(interval);
      }
      unsub?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
