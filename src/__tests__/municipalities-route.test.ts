import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/municipalities', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/services/municipalities')>()
  return {
    ...original,
    getMunicipalities: vi.fn(),
  }
})

describe('GET /api/municipalities', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('should return municipalities in expected format', async () => {
    const { getMunicipalities } = await import('@/services/municipalities')
    vi.mocked(getMunicipalities).mockResolvedValue([
      {
        id: 'id-1',
        slug: 'san-isidro',
        name: 'San Isidro',
        province: 'Buenos Aires',
        phone: '123',
        website: 'https://example.com',
        email: null,
        address: 'Some address',
        agent_name: 'Asistente',
        agent_welcome_message: 'Hola!',
        system_prompt_override: null,
        timezone: 'America/Argentina/Buenos_Aires',
        enabled: true,
        metadata: {},
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ])

    const { GET } = await import('@/app/api/municipalities/route')
    const res = await GET()
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.municipalities).toHaveLength(1)
    expect(body.municipalities[0]).toEqual({
      id: 'id-1',
      slug: 'san-isidro',
      name: 'San Isidro',
      province: 'Buenos Aires',
      agentName: 'Asistente',
      agentWelcomeMessage: 'Hola!',
    })
  })

  it('should return empty array when no municipalities', async () => {
    const { getMunicipalities } = await import('@/services/municipalities')
    vi.mocked(getMunicipalities).mockResolvedValue([])

    const { GET } = await import('@/app/api/municipalities/route')
    const res = await GET()
    const body = await res.json()
    expect(body.municipalities).toEqual([])
  })

  it('should return 500 when service throws', async () => {
    const { getMunicipalities } = await import('@/services/municipalities')
    vi.mocked(getMunicipalities).mockRejectedValue(new Error('DB error'))

    const { GET } = await import('@/app/api/municipalities/route')
    const res = await GET()
    expect(res.status).toBe(500)
  })

  it('should set cache headers', async () => {
    const { getMunicipalities } = await import('@/services/municipalities')
    vi.mocked(getMunicipalities).mockResolvedValue([])

    const { GET } = await import('@/app/api/municipalities/route')
    const res = await GET()
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=3600')
  })
})
