import { describe, it, expect } from 'vitest'
import { SEED_MUNICIPALITIES } from '@/services/municipalities'

describe('SEED_MUNICIPALITIES', () => {
  it('should have exactly 8 municipalities', () => {
    expect(SEED_MUNICIPALITIES).toHaveLength(8)
  })

  it('should have unique slugs', () => {
    const slugs = SEED_MUNICIPALITIES.map((m) => m.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('should all be in Buenos Aires province', () => {
    for (const m of SEED_MUNICIPALITIES) {
      expect(m.province).toBe('Buenos Aires')
    }
  })

  it('should all be enabled', () => {
    for (const m of SEED_MUNICIPALITIES) {
      expect(m.enabled).toBe(true)
    }
  })

  it('should all have required fields', () => {
    for (const m of SEED_MUNICIPALITIES) {
      expect(m.slug).toBeTruthy()
      expect(m.name).toBeTruthy()
      expect(m.phone).toBeTruthy()
      expect(m.website).toBeTruthy()
      expect(m.address).toBeTruthy()
      expect(m.agent_name).toBeTruthy()
    }
  })

  it('should have valid website URLs', () => {
    for (const m of SEED_MUNICIPALITIES) {
      expect(m.website).toMatch(/^https?:\/\//)
    }
  })

  it('should include expected municipalities', () => {
    const slugs = SEED_MUNICIPALITIES.map((m) => m.slug)
    expect(slugs).toContain('vicente-lopez')
    expect(slugs).toContain('san-isidro')
    expect(slugs).toContain('tigre')
    expect(slugs).toContain('la-plata')
  })
})
