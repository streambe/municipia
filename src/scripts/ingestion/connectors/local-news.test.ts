import { describe, it, expect } from 'vitest'
import { LOCAL_NEWS } from '../../../../scripts/ingestion/connectors/local-news'

describe('LOCAL_NEWS configuration', () => {
  it('has entries for all 8 municipalities', () => {
    const expected = [
      'vicente-lopez', 'san-isidro', 'moron', 'la-plata',
      'lanus', 'general-rodriguez', 'ameghino', 'tigre',
    ]
    for (const id of expected) {
      expect(LOCAL_NEWS[id]).toBeDefined()
      expect(Array.isArray(LOCAL_NEWS[id])).toBe(true)
    }
  })

  it('each source has name and url', () => {
    for (const [_id, sources] of Object.entries(LOCAL_NEWS)) {
      for (const source of sources) {
        expect(source.name).toBeTruthy()
        expect(source.url).toMatch(/^https?:\/\//)
      }
    }
  })

  it('ameghino has empty sources (expected)', () => {
    expect(LOCAL_NEWS['ameghino']).toHaveLength(0)
  })

  it('la-plata has multiple sources', () => {
    expect(LOCAL_NEWS['la-plata'].length).toBeGreaterThanOrEqual(2)
  })

  it('search paths start with /', () => {
    for (const sources of Object.values(LOCAL_NEWS)) {
      for (const source of sources) {
        if (source.searchPath) {
          expect(source.searchPath).toMatch(/^\//)
        }
      }
    }
  })
})
