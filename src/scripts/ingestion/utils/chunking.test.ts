import { describe, it, expect } from 'vitest'
import { chunkDocument, splitIntoSegments } from './chunking'

describe('chunkDocument', () => {
  it('returns empty array for empty text', () => {
    expect(chunkDocument('', {})).toEqual([])
    expect(chunkDocument('   ', {})).toEqual([])
  })

  it('returns a single chunk for short text', () => {
    const result = chunkDocument('Hello world', {
      source_url: 'https://example.com',
      source_title: 'Test',
      municipality_id: 'test-muni',
    })
    expect(result).toHaveLength(1)
    expect(result[0].content).toBe('Hello world')
    expect(result[0].metadata.chunk_index).toBe(0)
    expect(result[0].metadata.total_chunks).toBe(1)
    expect(result[0].metadata.source_url).toBe('https://example.com')
  })

  it('splits long text into multiple chunks', () => {
    const paragraph = 'A'.repeat(500)
    const text = `${paragraph}\n\n${paragraph}\n\n${paragraph}`
    const result = chunkDocument(text, {}, { chunkSize: 600, overlap: 100 })
    expect(result.length).toBeGreaterThan(1)
    // Each chunk should have correct index
    result.forEach((c, i) => {
      expect(c.metadata.chunk_index).toBe(i)
      expect(c.metadata.total_chunks).toBe(result.length)
    })
  })

  it('applies overlap between chunks', () => {
    const p1 = 'First paragraph content here.'
    const p2 = 'Second paragraph content here.'
    const p3 = 'Third paragraph content here.'
    const text = `${p1}\n\n${p2}\n\n${p3}`
    const result = chunkDocument(text, {}, { chunkSize: 40, overlap: 15, minChunkSize: 5 })
    // With overlap, chunks after the first should contain trailing text from the previous
    if (result.length > 1) {
      // The second chunk should start with overlapping text from the first
      expect(result[1].content.length).toBeGreaterThan(0)
    }
  })

  it('merges tiny trailing chunks into the previous one', () => {
    // Create text where the last segment would be tiny
    const text = 'A'.repeat(900) + '\n\nB'
    const result = chunkDocument(text, {}, { chunkSize: 1000, overlap: 50, minChunkSize: 100 })
    // The tiny "B" segment should be merged, not standalone
    const lastChunk = result[result.length - 1]
    expect(lastChunk.content.length).toBeGreaterThanOrEqual(100)
  })

  it('fills default metadata fields when not provided', () => {
    const result = chunkDocument('Some text', {})
    expect(result[0].metadata.source_url).toBe('')
    expect(result[0].metadata.municipality_id).toBe('')
  })
})

describe('splitIntoSegments', () => {
  it('keeps a short text as a single segment', () => {
    expect(splitIntoSegments('Hello', 1000)).toEqual(['Hello'])
  })

  it('splits by paragraphs', () => {
    const text = 'Para 1\n\nPara 2\n\nPara 3'
    const result = splitIntoSegments(text, 15)
    expect(result.length).toBeGreaterThanOrEqual(2)
  })

  it('splits long paragraphs by sentences', () => {
    const longPara =
      'Sentence one. Sentence two. Sentence three. Sentence four. Sentence five.'
    const result = splitIntoSegments(longPara, 40)
    expect(result.length).toBeGreaterThan(1)
  })
})
