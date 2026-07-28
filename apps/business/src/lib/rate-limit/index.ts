/**
 * In-memory rate limiter for middleware and sensitive actions.
 * Optional Upstash/Redis can replace this later via env.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
};

export function rateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): RateLimitResult {
  const now = input.now ?? Date.now();
  const existing = buckets.get(input.key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(input.key, { count: 1, resetAt: now + input.windowMs });
    return {
      allowed: true,
      remaining: input.limit - 1,
      retryAfterSec: Math.ceil(input.windowMs / 1000),
    };
  }

  if (existing.count >= input.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  buckets.set(input.key, existing);
  return {
    allowed: true,
    remaining: input.limit - existing.count,
    retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

/** Test helper */
export function resetRateLimitBuckets() {
  buckets.clear();
}
