import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/conversations', () => ({
  createConversation: vi.fn(),
  getConversation: vi.fn(),
  getMessages: vi.fn(),
}))

describe('POST /api/conversations', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('should return 400 when municipalityId is missing', async () => {
    const { POST } = await import('@/app/api/conversations/route')
    const req = new Request('http://localhost/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('municipalityId')
  })

  it('should return 400 when municipalityId is not a string', async () => {
    const { POST } = await import('@/app/api/conversations/route')
    const req = new Request('http://localhost/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ municipalityId: 123 }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('should return 201 with conversation data on success', async () => {
    const { createConversation } = await import('@/services/conversations')
    const mockConv = {
      id: 'conv-123',
      municipality_id: 'mun-456',
      started_at: '2026-04-02T10:00:00Z',
    }
    vi.mocked(createConversation).mockResolvedValue(mockConv as never)

    const { POST } = await import('@/app/api/conversations/route')
    const req = new Request('http://localhost/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ municipalityId: 'mun-456' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('conv-123')
    expect(body.municipalityId).toBe('mun-456')
    expect(body.startedAt).toBe('2026-04-02T10:00:00Z')
  })

  it('should return 500 when service throws', async () => {
    const { createConversation } = await import('@/services/conversations')
    vi.mocked(createConversation).mockRejectedValue(new Error('DB error'))

    const { POST } = await import('@/app/api/conversations/route')
    const req = new Request('http://localhost/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ municipalityId: 'mun-456' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})

describe('GET /api/conversations', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('should return 400 when id query param is missing', async () => {
    const { GET } = await import('@/app/api/conversations/route')
    const req = new Request('http://localhost/api/conversations')

    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('id')
  })

  it('should return 404 when conversation not found', async () => {
    const { getConversation } = await import('@/services/conversations')
    vi.mocked(getConversation).mockResolvedValue(null)

    const { GET } = await import('@/app/api/conversations/route')
    const req = new Request('http://localhost/api/conversations?id=nonexistent')

    const res = await GET(req)
    expect(res.status).toBe(404)
  })

  it('should return conversation with messages on success', async () => {
    const { getConversation, getMessages } = await import('@/services/conversations')
    vi.mocked(getConversation).mockResolvedValue({
      id: 'conv-1',
      municipality_id: 'mun-1',
      session_id: null,
      started_at: '2026-04-02T10:00:00Z',
      last_message_at: '2026-04-02T10:05:00Z',
      message_count: 2,
      metadata: {},
      feedback_rating: null,
    })
    vi.mocked(getMessages).mockResolvedValue([
      {
        id: 'msg-1',
        conversation_id: 'conv-1',
        municipality_id: 'mun-1',
        role: 'user',
        content: 'Hola',
        sources: [],
        token_count: null,
        latency_ms: null,
        model: null,
        created_at: '2026-04-02T10:00:00Z',
      },
      {
        id: 'msg-2',
        conversation_id: 'conv-1',
        municipality_id: 'mun-1',
        role: 'assistant',
        content: 'Hola! En que puedo ayudarte?',
        sources: [],
        token_count: null,
        latency_ms: null,
        model: null,
        created_at: '2026-04-02T10:00:01Z',
      },
    ])

    const { GET } = await import('@/app/api/conversations/route')
    const req = new Request('http://localhost/api/conversations?id=conv-1')

    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('conv-1')
    expect(body.municipalityId).toBe('mun-1')
    expect(body.messages).toHaveLength(2)
    expect(body.messages[0].role).toBe('user')
    expect(body.messages[1].role).toBe('assistant')
  })

  it('should return 500 when getMessages throws', async () => {
    const { getConversation, getMessages } = await import('@/services/conversations')
    vi.mocked(getConversation).mockResolvedValue({
      id: 'conv-1',
      municipality_id: 'mun-1',
      session_id: null,
      started_at: '2026-04-02T10:00:00Z',
      last_message_at: '2026-04-02T10:05:00Z',
      message_count: 0,
      metadata: {},
      feedback_rating: null,
    })
    vi.mocked(getMessages).mockRejectedValue(new Error('DB error'))

    const { GET } = await import('@/app/api/conversations/route')
    const req = new Request('http://localhost/api/conversations?id=conv-1')

    const res = await GET(req)
    expect(res.status).toBe(500)
  })
})
