/**
 * In-memory rate limiter for Edge Runtime.
 * Uses lazy cleanup instead of setInterval (not available in Edge).
 */

export interface RateLimitConfig {
  /** Time window in milliseconds (e.g. 60000 for 1 minute) */
  interval: number
  /** Maximum requests allowed per interval */
  maxRequests: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// Track last cleanup to avoid cleaning on every call
let lastCleanup = Date.now()
const CLEANUP_INTERVAL = 60_000

/**
 * Lazy cleanup: remove expired entries periodically.
 * Called internally before each rate limit check.
 */
function lazyCleanup(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}

/**
 * Check rate limit for a given key (typically IP address).
 * Returns whether the request is allowed and remaining quota.
 */
export function rateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  lazyCleanup(now)

  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + config.interval })
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.interval,
    }
  }

  if (entry.count >= config.maxRequests) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Extract client IP from request headers.
 */
export function getClientIP(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Build a 429 Too Many Requests response.
 */
export function rateLimitResponse(): Response {
  return new Response(
    JSON.stringify({
      error: 'Demasiadas solicitudes. Por favor espera unos segundos.',
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
        'X-RateLimit-Remaining': '0',
      },
    }
  )
}

/** Reset the internal map. Useful for testing. */
export function _resetForTesting(): void {
  rateLimitMap.clear()
  lastCleanup = Date.now()
}
