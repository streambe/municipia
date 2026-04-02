import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock dependencies before importing
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))
vi.mock('@/lib/ai/embeddings', () => ({
  generateEmbedding: vi.fn(),
}))

describe('retrieveContext', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    process.env.VOYAGE_API_KEY = 'test-voyage-key'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('should return empty result when SUPABASE_URL is not set', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    const { retrieveContext } = await import('@/services/rag')
    const result = await retrieveContext('mun-1', 'test query')

    expect(result).toEqual({ chunks: [], context: '' })
  })

  it('should return empty result when SUPABASE_SERVICE_ROLE_KEY is not set', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    const { retrieveContext } = await import('@/services/rag')
    const result = await retrieveContext('mun-1', 'test query')

    expect(result).toEqual({ chunks: [], context: '' })
  })

  it('should return empty result when VOYAGE_API_KEY is not set', async () => {
    delete process.env.VOYAGE_API_KEY

    const { retrieveContext } = await import('@/services/rag')
    const result = await retrieveContext('mun-1', 'test query')

    expect(result).toEqual({ chunks: [], context: '' })
  })

  it('should return empty result when embedding generation fails', async () => {
    const { generateEmbedding } = await import('@/lib/ai/embeddings')
    vi.mocked(generateEmbedding).mockRejectedValue(new Error('Voyage API down'))

    const { retrieveContext } = await import('@/services/rag')
    const result = await retrieveContext('mun-1', 'test query')

    expect(result).toEqual({ chunks: [], context: '' })
  })

  it('should return empty result when supabase RPC fails', async () => {
    const { generateEmbedding } = await import('@/lib/ai/embeddings')
    vi.mocked(generateEmbedding).mockResolvedValue([0.1, 0.2, 0.3])

    const { createServerClient } = await import('@/lib/supabase/server')
    vi.mocked(createServerClient).mockReturnValue({
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'function not found' },
      }),
    } as never)

    const { retrieveContext } = await import('@/services/rag')
    const result = await retrieveContext('mun-1', 'test query')

    expect(result).toEqual({ chunks: [], context: '' })
  })

  it('should return chunks and context on success', async () => {
    const mockChunks = [
      {
        id: 'chunk-1',
        document_id: 'doc-1',
        municipality_id: 'mun-1',
        chunk_index: 0,
        content: 'Horario de atención: Lunes a Viernes 8 a 14',
        token_count: 12,
        metadata: {},
        created_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'chunk-2',
        document_id: 'doc-2',
        municipality_id: 'mun-1',
        chunk_index: 0,
        content: 'Para habilitaciones comerciales presentar formulario F-100',
        token_count: 10,
        metadata: {},
        created_at: '2026-01-01T00:00:00Z',
      },
    ]

    const { generateEmbedding } = await import('@/lib/ai/embeddings')
    vi.mocked(generateEmbedding).mockResolvedValue([0.1, 0.2, 0.3])

    const { createServerClient } = await import('@/lib/supabase/server')
    vi.mocked(createServerClient).mockReturnValue({
      rpc: vi.fn().mockResolvedValue({ data: mockChunks, error: null }),
    } as never)

    const { retrieveContext } = await import('@/services/rag')
    const result = await retrieveContext('mun-1', 'horario de atención')

    expect(result.chunks).toHaveLength(2)
    expect(result.context).toContain('Horario de atención')
    expect(result.context).toContain('habilitaciones comerciales')
    expect(result.context).toContain('---')
  })

  it('should return empty result when RPC returns null data', async () => {
    const { generateEmbedding } = await import('@/lib/ai/embeddings')
    vi.mocked(generateEmbedding).mockResolvedValue([0.1, 0.2, 0.3])

    const { createServerClient } = await import('@/lib/supabase/server')
    vi.mocked(createServerClient).mockReturnValue({
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as never)

    const { retrieveContext } = await import('@/services/rag')
    const result = await retrieveContext('mun-1', 'test query')

    expect(result.chunks).toHaveLength(0)
    expect(result.context).toBe('')
  })

  it('should pass correct parameters to supabase RPC', async () => {
    const { generateEmbedding } = await import('@/lib/ai/embeddings')
    vi.mocked(generateEmbedding).mockResolvedValue([0.1, 0.2])

    const rpcMock = vi.fn().mockResolvedValue({ data: [], error: null })
    const { createServerClient } = await import('@/lib/supabase/server')
    vi.mocked(createServerClient).mockReturnValue({ rpc: rpcMock } as never)

    const { retrieveContext } = await import('@/services/rag')
    await retrieveContext('mun-abc', 'my query', 3, 0.5)

    expect(rpcMock).toHaveBeenCalledWith('match_chunks', {
      query_embedding: [0.1, 0.2],
      filter_municipality_id: 'mun-abc',
      match_threshold: 0.5,
      match_count: 3,
    })
  })
})
