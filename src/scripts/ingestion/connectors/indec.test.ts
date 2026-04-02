import { describe, it, expect, vi, afterEach } from 'vitest'
import { ingestINDEC, formatCensusChunk, CENSO_2022_DATA } from './indec'

describe('formatCensusChunk', () => {
  it('formats census data as readable text', () => {
    const data = CENSO_2022_DATA['vicente-lopez']!
    const text = formatCensusChunk(data)
    expect(text).toContain('Vicente Lopez')
    expect(text).toContain('Censo Nacional 2022')
    expect(text).toContain('habitantes')
    expect(text).toContain('Hogares')
    expect(text).toContain('Viviendas')
  })
})

describe('CENSO_2022_DATA', () => {
  it('has data for all configured municipalities', () => {
    const expected = [
      'vicente-lopez', 'san-isidro', 'moron', 'la-plata',
      'lanus', 'general-rodriguez', 'ameghino', 'tigre',
    ]
    for (const id of expected) {
      expect(CENSO_2022_DATA[id]).toBeDefined()
      expect(CENSO_2022_DATA[id].population).toBeGreaterThan(0)
    }
  })
})

describe('ingestINDEC', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns census data for known municipality', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as any)

    const result = await ingestINDEC('Vicente Lopez', 'vicente-lopez')
    expect(result.source).toBe('indec')
    expect(result.municipalityId).toBe('vicente-lopez')
    expect(result.pagesProcessed).toBe(1)
    expect(result.chunksCreated).toBe(1)
    expect(result.errors).toHaveLength(0)
  })

  it('returns error for unknown municipality', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as any)

    const result = await ingestINDEC('Ciudad Fantasma', 'ciudad-fantasma')
    expect(result.source).toBe('indec')
    expect(result.pagesProcessed).toBe(0)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain('No census data')
  })

  it('handles network errors gracefully', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))

    const result = await ingestINDEC('Moron', 'moron')
    expect(result.source).toBe('indec')
    // Should fall back to hardcoded data
    expect(result.pagesProcessed).toBe(1)
    expect(result.chunksCreated).toBe(1)
  })

  it('includes duration', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as any)

    const result = await ingestINDEC('Tigre', 'tigre')
    expect(result.duration).toBeGreaterThanOrEqual(0)
  })
})
