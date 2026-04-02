import { describe, it, expect, beforeEach, vi } from 'vitest'
import { rateLimit, getClientIP, rateLimitResponse, _resetForTesting } from '@/lib/rate-limit'

describe('rateLimit', () => {
  beforeEach(() => {
    _resetForTesting()
  })

  // --- Happy path: within limits ---
  it('should allow requests within the limit', () => {
    const config = { interval: 60_000, maxRequests: 5 }
    const result = rateLimit('192.168.1.1', config)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('should decrement remaining on each request', () => {
    const config = { interval: 60_000, maxRequests: 3 }
    const r1 = rateLimit('10.0.0.1', config)
    const r2 = rateLimit('10.0.0.1', config)
    const r3 = rateLimit('10.0.0.1', config)
    expect(r1.remaining).toBe(2)
    expect(r2.remaining).toBe(1)
    expect(r3.remaining).toBe(0)
    expect(r3.success).toBe(true)
  })

  // --- Exceeding limit ---
  it('should reject requests exceeding the limit', () => {
    const config = { interval: 60_000, maxRequests: 2 }
    rateLimit('1.2.3.4', config)
    rateLimit('1.2.3.4', config)
    const result = rateLimit('1.2.3.4', config)
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  // --- Different IPs are independent ---
  it('should track different keys independently', () => {
    const config = { interval: 60_000, maxRequests: 1 }
    const r1 = rateLimit('ip-a', config)
    const r2 = rateLimit('ip-b', config)
    expect(r1.success).toBe(true)
    expect(r2.success).toBe(true)
  })

  // --- Reset after interval ---
  it('should reset after interval expires', () => {
    const config = { interval: 100, maxRequests: 1 }
    rateLimit('expire-test', config)
    const blocked = rateLimit('expire-test', config)
    expect(blocked.success).toBe(false)

    // Simulate time passing
    vi.useFakeTimers()
    vi.advanceTimersByTime(150)

    const allowed = rateLimit('expire-test', config)
    expect(allowed.success).toBe(true)
    expect(allowed.remaining).toBe(0)

    vi.useRealTimers()
  })
})

describe('getClientIP', () => {
  it('should extract IP from x-forwarded-for', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    })
    expect(getClientIP(req)).toBe('1.2.3.4')
  })

  it('should fall back to x-real-ip', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '10.0.0.1' },
    })
    expect(getClientIP(req)).toBe('10.0.0.1')
  })

  it('should return unknown when no IP headers', () => {
    const req = new Request('http://localhost')
    expect(getClientIP(req)).toBe('unknown')
  })
})

describe('rateLimitResponse', () => {
  it('should return 429 status', () => {
    const res = rateLimitResponse()
    expect(res.status).toBe(429)
  })

  it('should include Retry-After header', () => {
    const res = rateLimitResponse()
    expect(res.headers.get('Retry-After')).toBe('60')
  })

  it('should return JSON error message', async () => {
    const res = rateLimitResponse()
    const body = await res.json()
    expect(body.error).toBeDefined()
  })
})
