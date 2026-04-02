import { describe, it, expect } from 'vitest'
import { emptyResult, mergeResults, type IngestResult } from './types'

describe('emptyResult', () => {
  it('creates a zeroed-out result with source and municipality', () => {
    const r = emptyResult('web', 'vicente-lopez')
    expect(r.source).toBe('web')
    expect(r.municipalityId).toBe('vicente-lopez')
    expect(r.pagesProcessed).toBe(0)
    expect(r.chunksCreated).toBe(0)
    expect(r.chunksUpdated).toBe(0)
    expect(r.chunksSkipped).toBe(0)
    expect(r.errors).toEqual([])
    expect(r.duration).toBe(0)
  })
})

describe('mergeResults', () => {
  it('returns empty result for empty array', () => {
    const r = mergeResults([])
    expect(r.source).toBe('merged')
  })

  it('sums all numeric fields and concatenates errors', () => {
    const a: IngestResult = {
      source: 'web',
      municipalityId: 'moron',
      pagesProcessed: 10,
      chunksCreated: 50,
      chunksUpdated: 2,
      chunksSkipped: 3,
      errors: ['err1'],
      duration: 1000,
    }
    const b: IngestResult = {
      source: 'ckan',
      municipalityId: 'moron',
      pagesProcessed: 5,
      chunksCreated: 20,
      chunksUpdated: 1,
      chunksSkipped: 0,
      errors: ['err2', 'err3'],
      duration: 500,
    }

    const merged = mergeResults([a, b])
    expect(merged.pagesProcessed).toBe(15)
    expect(merged.chunksCreated).toBe(70)
    expect(merged.chunksUpdated).toBe(3)
    expect(merged.chunksSkipped).toBe(3)
    expect(merged.errors).toEqual(['err1', 'err2', 'err3'])
    expect(merged.duration).toBe(1500)
    expect(merged.source).toBe('web+ckan')
    expect(merged.municipalityId).toBe('moron')
  })
})
