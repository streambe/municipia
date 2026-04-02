import { describe, it, expect, vi, afterEach } from 'vitest'
import { ingestPBAC } from './pbac'

describe('ingestPBAC', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns empty result with error when portal is inaccessible', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    } as any)

    const result = await ingestPBAC('Vicente Lopez', 'vicente-lopez')
    expect(result.source).toBe('pbac')
    expect(result.municipalityId).toBe('vicente-lopez')
    expect(result.pagesProcessed).toBe(0)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain('not accessible')
  })

  it('returns empty result when portal is accessible (dynamic rendering)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '<html><body>PBAC Portal</body></html>',
    } as any)

    const result = await ingestPBAC('Moron', 'moron')
    expect(result.source).toBe('pbac')
    expect(result.pagesProcessed).toBe(0)
    expect(result.chunksCreated).toBe(0)
    expect(result.errors).toHaveLength(0)
  })

  it('handles network errors gracefully', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))

    const result = await ingestPBAC('La Plata', 'la-plata')
    expect(result.source).toBe('pbac')
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('includes duration', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '<html></html>',
    } as any)

    const result = await ingestPBAC('Tigre', 'tigre')
    expect(result.duration).toBeGreaterThanOrEqual(0)
  })
})
