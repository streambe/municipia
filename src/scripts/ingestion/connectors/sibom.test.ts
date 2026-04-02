import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { extractBoletinText, ingestSIBOM } from './sibom'

describe('extractBoletinText', () => {
  it('extracts text from HTML removing noise', () => {
    const html = `
      <html><body>
        <script>var x = 1;</script>
        <nav>Menu</nav>
        <main><p>Ordenanza 1234 - Presupuesto municipal aprobado.</p></main>
        <footer>Copyright</footer>
      </body></html>
    `
    const text = extractBoletinText(html)
    expect(text).toContain('Ordenanza 1234')
    expect(text).toContain('Presupuesto municipal')
    expect(text).not.toContain('var x = 1')
  })

  it('returns empty string for empty HTML', () => {
    expect(extractBoletinText('')).toBe('')
    expect(extractBoletinText('<html><body></body></html>')).toBe('')
  })
})

describe('ingestSIBOM', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns empty result with error when SIBOM is not accessible', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    } as any)

    const result = await ingestSIBOM('Vicente López', 'vicente-lopez')
    expect(result.source).toBe('sibom')
    expect(result.municipalityId).toBe('vicente-lopez')
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain('not accessible')
  })

  it('does not crash on network error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))

    const result = await ingestSIBOM('Morón', 'moron')
    expect(result.source).toBe('sibom')
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('handles accessible main page with no municipality links', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<html><body><a href="/other">Other</a></body></html>',
    } as any)

    const result = await ingestSIBOM('Tigre', 'tigre')
    expect(result.source).toBe('sibom')
    // Should attempt search URLs, not crash
    expect(result.errors.length).toBe(0)
  }, 30_000)
})
