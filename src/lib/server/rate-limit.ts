type Bucket = { count: number; windowStart: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const MAX_POSTS_PER_WINDOW = 180;

function clientKey(request: Request): string {
  const h = request.headers.get("x-forwarded-for");
  if (h) {
    return h.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() ?? "local";
}

export function rateLimitPost(request: Request): { ok: true } | { ok: false } {
  const key = clientKey(request);
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now - b.windowStart > WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return { ok: true };
  }
  b.count += 1;
  if (b.count > MAX_POSTS_PER_WINDOW) {
    return { ok: false };
  }
  return { ok: true };
}

/** Best-effort GC to avoid unbounded Map growth (edge proxies rotate IPs). */
/** Clears in-memory counters (Vitest only). */
export function resetRateLimitBucketsForTests(): void {
  buckets.clear();
}

export function pruneRateLimitBuckets(maxEntries = 5000): void {
  if (buckets.size <= maxEntries) {
    return;
  }
  const now = Date.now();
  for (const [k, v] of buckets) {
    if (now - v.windowStart > WINDOW_MS * 2) {
      buckets.delete(k);
    }
  }
}
