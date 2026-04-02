import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/municipalities', () => ({
  getMunicipalityBySlug: vi.fn(),
}))

describe('GET /api/municipalities/[slug]', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('should return municipality data for valid slug', async () => {
    const { getMunicipalityBySlug } = await import('@/services/municipalities')
    vi.mocked(getMunicipalityBySlug).mockResolvedValue({
      id: 'id-1',
      slug: 'san-isidro',
      name: 'San Isidro',
      province: 'Buenos Aires',
      phone: '(011) 4512-3131',
      website: 'https://www.sanisidro.gob.ar',
      email: 'consultas@sanisidro.gob.ar',
      address: '9 de Julio 2150',
      agent_name: 'Asistente de San Isidro',
      agent_welcome_message: 'Hola! En que puedo ayudarte?',
      system_prompt_override: null,
      timezone: 'America/Argentina/Buenos_Aires',
      enabled: true,
      metadata: {},
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    })

    const { GET } = await import(
      '@/app/api/municipalities/[slug]/route'
    )
    const req = new Request('http://localhost/api/municipalities/san-isidro')
    const res = await GET(req, { params: Promise.resolve({ slug: 'san-isidro' }) })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.slug).toBe('san-isidro')
    expect(body.name).toBe('San Isidro')
    expect(body.agentName).toBe('Asistente de San Isidro')
    expect(body.phone).toBe('(011) 4512-3131')
    // Should not expose internal fields
    expect(body.system_prompt_override).toBeUndefined()
    expect(body.enabled).toBeUndefined()
    expect(body.metadata).toBeUndefined()
  })

  it('should return 404 for non-existent slug', async () => {
    const { getMunicipalityBySlug } = await import('@/services/municipalities')
    vi.mocked(getMunicipalityBySlug).mockResolvedValue(null)

    const { GET } = await import(
      '@/app/api/municipalities/[slug]/route'
    )
    const req = new Request('http://localhost/api/municipalities/no-existe')
    const res = await GET(req, { params: Promise.resolve({ slug: 'no-existe' }) })

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toContain('not found')
  })

  it('should return 500 when service throws', async () => {
    const { getMunicipalityBySlug } = await import('@/services/municipalities')
    vi.mocked(getMunicipalityBySlug).mockRejectedValue(new Error('DB error'))

    const { GET } = await import(
      '@/app/api/municipalities/[slug]/route'
    )
    const req = new Request('http://localhost/api/municipalities/san-isidro')
    const res = await GET(req, { params: Promise.resolve({ slug: 'san-isidro' }) })

    expect(res.status).toBe(500)
  })
})
