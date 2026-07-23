// ============================================================
// Minimal in-memory fixed-window rate limiter.
//
// SCOPE — be honest about what this is. State lives in the module closure, so
// it is per-serverless-instance: a determined attacker spreading requests
// across concurrently warm instances gets a higher effective ceiling than the
// configured one. It is a speed bump against casual spam and accidental
// double-submits, NOT a security control. The real defence for /api/donate is
// that nothing is published until a human verifies the payment against a bank
// statement — a flood of junk declarations costs the team review time, not
// money or credibility.
//
// If abuse ever becomes real, swap this for Vercel BotID or a durable store
// (Upstash Redis via the Marketplace) behind the same `check()` signature.
// ============================================================

interface Bucket {
  count: number
  /** Epoch ms when the current window expires. */
  resetAt: number
}

const buckets = new Map<string, Bucket>()

/** Drop expired buckets so a long-lived instance cannot grow unbounded. */
function sweep(now: number) {
  if (buckets.size < 500) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export interface RateLimitResult {
  ok: boolean
  /** Requests left in the current window. */
  remaining: number
  /** Seconds until the window resets — suitable for a Retry-After header. */
  retryAfter: number
}

/**
 * Consume one token for `key`.
 *
 * @param key     Caller-scoped identity, e.g. `donate:${ip}`.
 * @param limit   Requests allowed per window.
 * @param windowMs Window length in milliseconds.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfter: 0 }
  }

  bucket.count += 1
  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
  if (bucket.count > limit) {
    return { ok: false, remaining: 0, retryAfter }
  }
  return { ok: true, remaining: limit - bucket.count, retryAfter }
}

/**
 * Best-effort client IP.
 *
 * `x-forwarded-for` is spoofable in general, but on Vercel the platform
 * rewrites it at the edge, so the leftmost entry is trustworthy there. Falls
 * back to a shared bucket when no header is present, which is deliberately
 * conservative: an unknown origin gets rate-limited alongside every other
 * unknown origin rather than escaping the limit entirely.
 */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}
