// In-memory token bucket rate limiter keyed per user.
// Notes:
// - Per-instance only. Good enough for Fluid Compute / single-VPS deployments.
// - For multi-region Redis-backed limits, swap the store without changing the API.

type Bucket = { tokens: number; updatedAt: number };

const buckets = new Map<string, Bucket>();

const globalStore = globalThis as unknown as { __rlBuckets?: Map<string, Bucket> };
if (!globalStore.__rlBuckets) globalStore.__rlBuckets = buckets;
const store = globalStore.__rlBuckets;

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetMs: number;
};

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  const refillPerMs = opts.limit / opts.windowMs;
  const existing = store.get(key);

  const bucket: Bucket = existing
    ? {
        tokens: Math.min(
          opts.limit,
          existing.tokens + (now - existing.updatedAt) * refillPerMs
        ),
        updatedAt: now,
      }
    : { tokens: opts.limit, updatedAt: now };

  if (bucket.tokens < 1) {
    const resetMs = Math.ceil((1 - bucket.tokens) / refillPerMs);
    store.set(key, bucket);
    return { success: false, remaining: 0, resetMs };
  }

  bucket.tokens -= 1;
  store.set(key, bucket);
  return {
    success: true,
    remaining: Math.floor(bucket.tokens),
    resetMs: 0,
  };
}
