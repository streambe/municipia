import { describe, it, expect } from 'vitest'
import { SEARCH_QUERIES } from '../../../../scripts/ingestion/connectors/google-search'

describe('SEARCH_QUERIES', () => {
  it('has 10 search query templates', () => {
    expect(SEARCH_QUERIES).toHaveLength(10)
  })

  it('all queries contain {municipality} placeholder', () => {
    for (const q of SEARCH_QUERIES) {
      expect(q).toContain('{municipality}')
    }
  })

  it('queries cover expected topics', () => {
    const joined = SEARCH_QUERIES.join(' ')
    expect(joined).toContain('trámites')
    expect(joined).toContain('noticias')
    expect(joined).toContain('obras públicas')
    expect(joined).toContain('presupuesto')
    expect(joined).toContain('hospitales')
    expect(joined).toContain('escuelas')
    expect(joined).toContain('cultura')
    expect(joined).toContain('transporte')
  })

  it('replaces placeholder correctly', () => {
    const query = SEARCH_QUERIES[0].replace('{municipality}', 'Tigre')
    expect(query).toContain('Tigre')
    expect(query).not.toContain('{municipality}')
  })
})
