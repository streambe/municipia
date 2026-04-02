import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { extractFinancialText, extractTables, ingestBAAbierta } from './ba-abierta'

describe('extractFinancialText', () => {
  it('extracts text content from HTML', () => {
    const html = `
      <html><body>
        <script>ignore</script>
        <main><p>Presupuesto 2024: $1.500.000.000</p></main>
      </body></html>
    `
    const text = extractFinancialText(html)
    expect(text).toContain('Presupuesto 2024')
    expect(text).toContain('1.500.000.000')
  })
})

describe('extractTables', () => {
  it('extracts table data as text', () => {
    const html = `
      <table>
        <tr><th>Concepto</th><th>Monto</th></tr>
        <tr><td>Ingresos</td><td>500000</td></tr>
        <tr><td>Gastos</td><td>450000</td></tr>
      </table>
    `
    const tables = extractTables(html)
    expect(tables).toHaveLength(1)
    expect(tables[0]).toContain('Concepto | Monto')
    expect(tables[0]).toContain('Ingresos | 500000')
  })

  it('returns empty array when no tables', () => {
    expect(extractTables('<html><body><p>No tables</p></body></html>')).toEqual([])
  })

  it('handles multiple tables', () => {
    const html = '<table><tr><td>A</td></tr></table><table><tr><td>B</td></tr></table>'
    const tables = extractTables(html)
    expect(tables).toHaveLength(2)
  })
})

describe('ingestBAAbierta', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns error when portal is not accessible', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as any)

    const result = await ingestBAAbierta('La Plata', 'la-plata')
    expect(result.source).toBe('ba_abierta')
    expect(result.municipalityId).toBe('la-plata')
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('does not crash on network error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('timeout'))

    const result = await ingestBAAbierta('Lanús', 'lanus')
    expect(result.source).toBe('ba_abierta')
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('handles accessible portal with no municipality data', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<html><body><p>Portal principal</p></body></html>',
    } as any)

    const result = await ingestBAAbierta('Ameghino', 'ameghino')
    expect(result.source).toBe('ba_abierta')
    expect(result.errors.length).toBe(0)
  }, 30_000)
})
