import { describe, it, expect, vi, beforeEach } from 'vitest'

// We test the admin auth validation logic in isolation
// by importing and testing the route handlers

describe('Admin API authentication', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_API_KEY', 'test-admin-key-123')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key')
  })

  describe('POST /api/admin/ingest', () => {
    it('should return 401 without authorization header', async () => {
      const { POST } = await import('@/app/api/admin/ingest/route')
      const req = new Request('http://localhost/api/admin/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ municipalityId: 'test' }),
      })

      const res = await POST(req)
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toBe('Unauthorized')
    })

    it('should return 401 with wrong API key', async () => {
      const { POST } = await import('@/app/api/admin/ingest/route')
      const req = new Request('http://localhost/api/admin/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer wrong-key',
        },
        body: JSON.stringify({ municipalityId: 'test' }),
      })

      const res = await POST(req)
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/admin/stats', () => {
    it('should return 401 without authorization header', async () => {
      const { GET } = await import('@/app/api/admin/stats/route')
      const req = new Request('http://localhost/api/admin/stats', {
        method: 'GET',
      })

      const res = await GET(req)
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toBe('Unauthorized')
    })

    it('should return 401 with wrong API key', async () => {
      const { GET } = await import('@/app/api/admin/stats/route')
      const req = new Request('http://localhost/api/admin/stats', {
        method: 'GET',
        headers: { Authorization: 'Bearer wrong-key' },
      })

      const res = await GET(req)
      expect(res.status).toBe(401)
    })
  })
})
