import { describe, it, expect } from 'vitest'
import { ingestGeoData, formatGeoChunk, GEO_DATA } from './geo-data'

describe('GEO_DATA', () => {
  it('has data for all 8 municipalities', () => {
    const expected = [
      'vicente-lopez', 'san-isidro', 'moron', 'la-plata',
      'lanus', 'general-rodriguez', 'ameghino', 'tigre',
    ]
    for (const id of expected) {
      expect(GEO_DATA[id]).toBeDefined()
      expect(GEO_DATA[id].localidades.length).toBeGreaterThan(0)
      expect(GEO_DATA[id].superficie).toBeTruthy()
      expect(GEO_DATA[id].poblacion).toBeTruthy()
      expect(GEO_DATA[id].limites).toBeTruthy()
    }
  })
})

describe('formatGeoChunk', () => {
  it('formats geo data as readable text', () => {
    const data = GEO_DATA['tigre']
    const text = formatGeoChunk('tigre', 'Tigre', data)
    expect(text).toContain('Tigre')
    expect(text).toContain('360 km²')
    expect(text).toContain('Don Torcuato')
    expect(text).toContain('Límites')
    expect(text).toContain('San Fernando')
  })

  it('includes all localidades', () => {
    const data = GEO_DATA['la-plata']
    const text = formatGeoChunk('la-plata', 'La Plata', data)
    for (const loc of data.localidades) {
      expect(text).toContain(loc)
    }
  })
})

describe('ingestGeoData', () => {
  it('returns geo data for known municipality', async () => {
    const result = await ingestGeoData('Tigre', 'tigre')
    expect(result.source).toBe('geo_data')
    expect(result.municipalityId).toBe('tigre')
    expect(result.pagesProcessed).toBe(1)
    expect(result.chunksCreated).toBe(1)
    expect(result.errors).toHaveLength(0)
  })

  it('returns error for unknown municipality', async () => {
    const result = await ingestGeoData('Ciudad Fantasma', 'ciudad-fantasma')
    expect(result.source).toBe('geo_data')
    expect(result.pagesProcessed).toBe(0)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain('No geo data')
  })

  it('includes duration', async () => {
    const result = await ingestGeoData('Morón', 'moron')
    expect(result.duration).toBeGreaterThanOrEqual(0)
  })

  it('works for all configured municipalities', async () => {
    const ids = Object.keys(GEO_DATA)
    for (const id of ids) {
      const result = await ingestGeoData(id, id)
      expect(result.pagesProcessed).toBe(1)
      expect(result.errors).toHaveLength(0)
    }
  })
})
