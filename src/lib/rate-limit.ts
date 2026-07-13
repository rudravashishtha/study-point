// In-memory sliding-window rate limiter (module scope).
//
// NOTE: process memory is NOT shared across serverless instances. This is the
// agreed Phase 10B MVP ("no Redis initially"). It is correct for single-instance
// and Fluid Compute dev/small deployments. Replace with Upstash Redis when the app
// is confirmed to run multi-instance in production. The limiter fails open: a
// store error must never block legitimate requests.

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();
const MAX_ENTRIES = 5000;

export type RateLimitResult = { success: boolean; retryAfter?: number };

export function rateLimit(
  identifier: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();

  if (store.size > MAX_ENTRIES) {
    for (const [key, value] of store) {
      if (value.resetAt <= now) store.delete(key);
    }
  }

  const existing = store.get(identifier);
  if (!existing || existing.resetAt <= now) {
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }

  if (existing.count >= max) {
    return { success: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { success: true };
}
