import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock external dependencies
vi.mock('@/lib/ai/anthropic', () => ({
  anthropic: vi.fn(),
}))
vi.mock('ai', () => ({
  streamText: vi.fn(),
}))
vi.mock('@/services/rag', () => ({
  retrieveContext: vi.fn(),
}))
vi.mock('@/services/conversations', () => ({
  addMessage: vi.fn(),
}))
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({ data: null, error: { message: 'not found' } }),
          }),
        }),
      }),
    }),
  }),
}))

describe('POST /api/chat - input validation', () => {
  beforeEach(() => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-key')
  })

  it('should return 400 when municipalityId is missing', async () => {
    const { POST } = await import('@/app/api/chat/route')
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hola' }] }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('municipalityId')
  })

  it('should return 400 when messages is empty', async () => {
    const { POST } = await import('@/app/api/chat/route')
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ municipalityId: 'test', messages: [] }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('should return 400 when last message exceeds 2000 chars', async () => {
    const { POST } = await import('@/app/api/chat/route')
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        municipalityId: 'test',
        messages: [{ role: 'user', content: 'x'.repeat(2001) }],
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('should return 404 when municipality not found', async () => {
    const { POST } = await import('@/app/api/chat/route')
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        municipalityId: 'nonexistent-id',
        messages: [{ role: 'user', content: 'Hola' }],
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(404)
  })
})
