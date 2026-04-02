import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { csvToText, jsonToText, ingestCKAN, type CKANConfig } from './ckan'

// ---------------------------------------------------------------------------
// Unit tests — pure functions
// ---------------------------------------------------------------------------

describe('csvToText', () => {
  it('converts CSV to readable text', () => {
    const csv = 'nombre,edad,ciudad\nJuan,30,La Plata\nAna,25,Morón'
    const result = csvToText(csv)
    expect(result).toContain('Columnas: nombre,edad,ciudad')
    expect(result).toContain('Juan,30,La Plata')
    expect(result).toContain('Ana,25,Morón')
  })

  it('returns empty string for empty CSV', () => {
    expect(csvToText('')).toBe('')
    expect(csvToText('   ')).toBe('')
  })

  it('respects maxRows limit', () => {
    const header = 'a,b'
    const rows = Array.from({ length: 10 }, (_, i) => `${i},${i}`)
    const csv = [header, ...rows].join('\n')
    const result = csvToText(csv, 3)
    // Should have header + 3 data rows
    const lines = result.split('\n').filter((l) => l.trim())
    expect(lines.length).toBeLessThanOrEqual(5) // header line + blank + 3 rows
  })
})

describe('jsonToText', () => {
  it('converts JSON array to readable text', () => {
    const json = JSON.stringify([
      { nombre: 'Juan', edad: 30 },
      { nombre: 'Ana', edad: 25 },
    ])
    const result = jsonToText(json)
    expect(result).toContain('nombre: Juan')
    expect(result).toContain('edad: 30')
  })

  it('handles single object', () => {
    const json = JSON.stringify({ key: 'value' })
    const result = jsonToText(json)
    expect(result).toContain('key: value')
  })

  it('returns empty string for invalid JSON', () => {
    expect(jsonToText('not json')).toBe('')
  })

  it('respects maxItems limit', () => {
    const arr = Array.from({ length: 10 }, (_, i) => ({ id: i }))
    const result = jsonToText(JSON.stringify(arr), 2)
    const lines = result.split('\n').filter((l) => l.trim())
    expect(lines.length).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Integration tests — mocked fetch
// ---------------------------------------------------------------------------

describe('ingestCKAN', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.useRealTimers()
  })

  const config: CKANConfig = {
    portalUrl: 'https://test-portal.example.com',
    portalName: 'Test Portal',
    municipalityKeywords: ['La Plata'],
  }

  it('returns empty result when no keywords', async () => {
    const result = await ingestCKAN(
      { ...config, municipalityKeywords: [] },
      'la-plata'
    )
    expect(result.source).toContain('test_portal')
    expect(result.municipalityId).toBe('la-plata')
    expect(result.errors.length).toBe(1)
    expect(result.errors[0]).toContain('No keywords')
  })

  it('handles successful CKAN API response with CSV resource', async () => {
    const mockResponse = {
      success: true,
      result: {
        count: 1,
        results: [
          {
            id: 'ds-1',
            name: 'test-dataset',
            title: 'Test Dataset',
            notes: 'A test dataset',
            license_title: 'CC BY',
            resources: [
              {
                id: 'res-1',
                name: 'data.csv',
                format: 'CSV',
                url: 'https://test-portal.example.com/data.csv',
              },
            ],
          },
        ],
      },
    }

    const csvData = 'col1,col2\n' + Array.from({ length: 20 }, (_, i) => `val${i}a,val${i}b`).join('\n')

    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers(),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => csvData,
        headers: new Headers({ 'content-length': String(csvData.length) }),
      } as any)

    const result = await ingestCKAN(config, 'la-plata')
    expect(result.pagesProcessed).toBe(1)
    expect(result.errors.length).toBe(0)
  })

  it('handles CKAN API failure gracefully', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: new Headers(),
    } as any)

    const result = await ingestCKAN(config, 'la-plata')
    expect(result.errors.length).toBeGreaterThan(0)
    // Should not throw
  })

  it('handles network error gracefully', async () => {
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    const result = await ingestCKAN(config, 'la-plata')
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('skips datasets with only unsupported formats', async () => {
    const mockResponse = {
      success: true,
      result: {
        count: 1,
        results: [
          {
            id: 'ds-1',
            name: 'test-xls',
            title: 'XLS Only Dataset',
            resources: [
              { id: 'res-1', name: 'data.xls', format: 'XLS', url: 'https://example.com/data.xls' },
            ],
          },
        ],
      },
    }

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
      headers: new Headers(),
    } as any)

    const result = await ingestCKAN(config, 'la-plata')
    expect(result.pagesProcessed).toBe(0)
    expect(result.chunksSkipped).toBe(1)
  })
})
