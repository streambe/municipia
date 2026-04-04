import { describe, it, expect, vi, afterEach } from 'vitest'
import { ingestWikipedia, fetchWikiArticle, WIKI_TITLES } from './wikipedia'

describe('WIKI_TITLES', () => {
  it('has titles for all 8 municipalities', () => {
    const expected = [
      'vicente-lopez', 'san-isidro', 'moron', 'la-plata',
      'lanus', 'general-rodriguez', 'ameghino', 'tigre',
    ]
    for (const id of expected) {
      expect(WIKI_TITLES[id]).toBeDefined()
      expect(WIKI_TITLES[id].length).toBeGreaterThan(0)
    }
  })
})

describe('fetchWikiArticle', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns article content on success', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true } as any) // summary check
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<html><body><p>Contenido del artículo sobre el Partido de Tigre con información relevante para el municipio. El Partido de Tigre es un partido del norte del Gran Buenos Aires, en la provincia de Buenos Aires, Argentina. Su cabecera es la ciudad de Tigre. Tiene una superficie de 360 km cuadrados.</p></body></html>'),
      } as any) // HTML fetch

    const result = await fetchWikiArticle('Partido de Tigre')
    expect(result).not.toBeNull()
    expect(result!.title).toBe('Partido de Tigre')
    expect(result!.content).toContain('Partido de Tigre')
  })

  it('returns null when article not found', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 404 } as any)

    const result = await fetchWikiArticle('Articulo_Inexistente')
    expect(result).toBeNull()
  })

  it('returns null on network error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('ECONNREFUSED'))

    const result = await fetchWikiArticle('Partido de Tigre')
    expect(result).toBeNull()
  })

  it('returns null when content is too short', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true } as any)
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<html><body><p>Short</p></body></html>'),
      } as any)

    const result = await fetchWikiArticle('Short_Article')
    expect(result).toBeNull()
  })
})

describe('ingestWikipedia', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('processes articles for known municipality', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true } as any)
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<html><body><p>Artículo extenso sobre el Partido de Tigre con datos históricos, geográficos y demográficos relevantes para el municipio.</p></body></html>'),
      } as any)
      .mockResolvedValueOnce({ ok: true } as any)
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<html><body><p>Artículo extenso sobre Tigre Buenos Aires con datos históricos, geográficos y demográficos relevantes para el municipio.</p></body></html>'),
      } as any)

    const result = await ingestWikipedia('Tigre', 'tigre')
    expect(result.source).toBe('wikipedia')
    expect(result.municipalityId).toBe('tigre')
    expect(result.pagesProcessed).toBeGreaterThan(0)
    expect(result.errors).toHaveLength(0)
  })

  it('returns empty result for unknown municipality', async () => {
    const result = await ingestWikipedia('Ciudad Fantasma', 'ciudad-fantasma')
    expect(result.source).toBe('wikipedia')
    expect(result.pagesProcessed).toBe(0)
  })

  it('includes duration', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 } as any)

    const result = await ingestWikipedia('Tigre', 'tigre')
    expect(result.duration).toBeGreaterThanOrEqual(0)
  })

  it('handles partial failures gracefully', async () => {
    globalThis.fetch = vi.fn()
      .mockRejectedValueOnce(new Error('Network error')) // first article fails
      .mockResolvedValueOnce({ ok: true } as any) // second article summary OK
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<html><body><p>Artículo extenso sobre Tigre Buenos Aires con datos históricos, geográficos y demográficos que son relevantes.</p></body></html>'),
      } as any)

    const result = await ingestWikipedia('Tigre', 'tigre')
    expect(result.pagesProcessed).toBe(1)
    expect(result.errors).toHaveLength(0) // errors from fetchWikiArticle are logged, not pushed
  })
})
