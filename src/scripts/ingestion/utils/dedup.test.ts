import { describe, it, expect, vi } from 'vitest'
import { isDocumentChanged, upsertDocument, upsertChunks } from './dedup'

// ---------------------------------------------------------------------------
// Mock Supabase client factory
// ---------------------------------------------------------------------------

function mockSupabase(overrides: Record<string, any> = {}) {
  const client: any = {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: { id: 'new-uuid' }, error: null }),
      ...overrides,
    }),
  }
  return client
}

// ---------------------------------------------------------------------------
// isDocumentChanged
// ---------------------------------------------------------------------------

describe('isDocumentChanged', () => {
  it('returns true when document does not exist', async () => {
    const sb = mockSupabase({
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    const result = await isDocumentChanged(sb, 'https://example.com/page', 'abc123')
    expect(result).toBe(true)
  })

  it('returns false when hash matches', async () => {
    const sb = mockSupabase({
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'existing', content_hash: 'abc123' },
        error: null,
      }),
    })
    const result = await isDocumentChanged(sb, 'https://example.com/page', 'abc123')
    expect(result).toBe(false)
  })

  it('returns true when hash differs', async () => {
    const sb = mockSupabase({
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'existing', content_hash: 'old-hash' },
        error: null,
      }),
    })
    const result = await isDocumentChanged(sb, 'https://example.com/page', 'new-hash')
    expect(result).toBe(true)
  })

  it('returns true on query error (safe default)', async () => {
    const sb = mockSupabase({
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'connection error' },
      }),
    })
    const result = await isDocumentChanged(sb, 'https://example.com/page', 'abc')
    expect(result).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// upsertDocument
// ---------------------------------------------------------------------------

describe('upsertDocument', () => {
  it('inserts a new document and returns its id', async () => {
    const insertSingle = vi.fn().mockResolvedValue({ data: { id: 'new-id' }, error: null })
    const sb = mockSupabase({
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: insertSingle,
    })

    const id = await upsertDocument(sb, {
      url: 'https://example.com/new',
      title: 'New Page',
      contentHash: 'hash1',
      contentLength: 500,
      municipalityId: 'muni-uuid',
    })

    expect(id).toBe('new-id')
  })

  it('updates an existing document and returns its id', async () => {
    const sb = mockSupabase({
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'existing-id' }, error: null }),
    })

    // Stub update chain
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    const deleteChain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }

    let callCount = 0
    sb.from = vi.fn().mockImplementation((table: string) => {
      callCount++
      if (callCount === 1) {
        // First call: select to find existing
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'existing-id' }, error: null }),
        }
      }
      if (table === 'document_chunks') return deleteChain
      return updateChain
    })

    const id = await upsertDocument(sb, {
      url: 'https://example.com/existing',
      title: 'Updated',
      contentHash: 'new-hash',
      contentLength: 600,
      municipalityId: 'muni-uuid',
    })

    expect(id).toBe('existing-id')
  })

  it('throws on insert error', async () => {
    const sb = mockSupabase({
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'insert failed' } }),
    })

    await expect(
      upsertDocument(sb, {
        url: 'https://example.com',
        title: 'X',
        contentHash: 'h',
        contentLength: 1,
        municipalityId: 'muni',
      })
    ).rejects.toThrow('insert')
  })
})

// ---------------------------------------------------------------------------
// upsertChunks
// ---------------------------------------------------------------------------

describe('upsertChunks', () => {
  it('inserts chunks and returns the count', async () => {
    const sb = mockSupabase({})
    sb.from = vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })

    const chunks = [
      { content: 'chunk 1', metadata: { source_url: 'u' } },
      { content: 'chunk 2', metadata: { source_url: 'u' } },
    ]
    const embeddings = [[0.1, 0.2], [0.3, 0.4]]

    const count = await upsertChunks(sb, 'doc-id', 'muni-id', chunks, embeddings)
    expect(count).toBe(2)
  })

  it('throws on insert error', async () => {
    const sb = mockSupabase({})
    sb.from = vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: { message: 'fail' } }),
    })

    await expect(
      upsertChunks(sb, 'doc', 'muni', [{ content: 'x', metadata: {} }], [[0.1]])
    ).rejects.toBeTruthy()
  })
})
