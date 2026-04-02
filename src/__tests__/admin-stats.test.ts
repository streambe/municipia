import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock rate-limit to always allow
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: () => ({ success: true, remaining: 9, resetAt: Date.now() + 60000 }),
  getClientIP: () => '127.0.0.1',
  rateLimitResponse: () => new Response('rate limited', { status: 429 }),
}))

// Build a chainable supabase mock
function mockChain(data: unknown, count: number | null = null) {
  const chain: Record<string, unknown> = {}
  const self = () => chain
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.gte = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.limit = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data, error: null })
  // When awaited directly (no .single()), resolve via .then
  chain.then = (resolve: (v: unknown) => void) =>
    resolve({ data: Array.isArray(data) ? data : [data], count, error: null })
  return chain
}

const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({ from: mockFrom }),
}))

// Import after mocks
import { GET } from '@/app/api/admin/stats/route'

function makeReq(adminKey?: string) {
  const headers: Record<string, string> = { 'x-forwarded-for': '127.0.0.1' }
  if (adminKey) headers['authorization'] = `Bearer ${adminKey}`
  return new Request('http://localhost/api/admin/stats', { headers })
}

describe('GET /api/admin/stats', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_API_KEY', 'test-key')
    mockFrom.mockReset()
  })

  it('should return 401 without auth', async () => {
    const res = await GET(makeReq())
    expect(res.status).toBe(401)
  })

  it('should return stats with valid auth', async () => {
    // Setup mocks for each .from() call in order
    const municipalities = [{ id: 'vl', name: 'Vicente Lopez' }]
    const documents = [{ municipality_id: 'vl' }]
    const chunks = [{ municipality_id: 'vl' }, { municipality_id: 'vl' }]
    const conversations = [{ id: '1' }]
    const allMessages = [{ id: 'm1', municipality_id: 'vl' }]
    const conv24h = [{ id: '1', municipality_id: 'vl' }]
    const msg24h = [{ id: 'm1', municipality_id: 'vl', latency_ms: 200 }]
    const ingestionLog = [{ created_at: '2026-04-02T06:00:00Z', status: 'success' }]

    mockFrom
      .mockReturnValueOnce(mockChain(municipalities, 1))  // municipalities
      .mockReturnValueOnce(mockChain(documents, 1))        // documents
      .mockReturnValueOnce(mockChain(chunks, 2))            // chunks
      .mockReturnValueOnce(mockChain(conversations, 1))     // conversations
      .mockReturnValueOnce(mockChain(allMessages, 1))       // total messages
      .mockReturnValueOnce(mockChain(conv24h, 1))           // conversations 24h
      .mockReturnValueOnce(mockChain(msg24h, 1))            // messages 24h
      .mockReturnValueOnce(mockChain(ingestionLog, null))   // ingestion_logs

    const res = await GET(makeReq('test-key'))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toHaveProperty('totalConversations')
    expect(body).toHaveProperty('totalMessages')
    expect(body).toHaveProperty('lastIngestion')
    expect(body).toHaveProperty('last24h')
    expect(body).toHaveProperty('byMunicipality')
    expect(body.last24h).toHaveProperty('conversations')
    expect(body.last24h).toHaveProperty('messages')
    expect(body.last24h).toHaveProperty('avgLatencyMs')
  })
})
