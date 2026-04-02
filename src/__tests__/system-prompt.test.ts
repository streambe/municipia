import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import type { Municipality } from '@/types/municipality'

const baseMunicipality: Municipality = {
  id: 'test-id',
  slug: 'san-isidro',
  name: 'San Isidro',
  province: 'Buenos Aires',
  phone: '(011) 4512-3131',
  website: 'https://www.sanisidro.gob.ar',
  email: 'consultas@sanisidro.gob.ar',
  address: '9 de Julio 2150',
  agent_name: 'Asistente de San Isidro',
  agent_welcome_message: null,
  system_prompt_override: null,
  timezone: 'America/Argentina/Buenos_Aires',
  enabled: true,
  metadata: {},
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

describe('buildSystemPrompt', () => {
  it('should include municipality name and agent name', () => {
    const prompt = buildSystemPrompt(baseMunicipality, 'some context')
    expect(prompt).toContain('Asistente de San Isidro')
    expect(prompt).toContain('San Isidro')
  })

  it('should include contact information', () => {
    const prompt = buildSystemPrompt(baseMunicipality, '')
    expect(prompt).toContain('(011) 4512-3131')
    expect(prompt).toContain('https://www.sanisidro.gob.ar')
    expect(prompt).toContain('9 de Julio 2150')
    expect(prompt).toContain('consultas@sanisidro.gob.ar')
  })

  it('should include RAG context when provided', () => {
    const context = 'Horario de atención: Lunes a Viernes de 8 a 14.'
    const prompt = buildSystemPrompt(baseMunicipality, context)
    expect(prompt).toContain(context)
  })

  it('should show fallback message when no context', () => {
    const prompt = buildSystemPrompt(baseMunicipality, '')
    expect(prompt).toContain('No se encontraron documentos relevantes')
  })

  it('should handle null phone/website/email/address gracefully', () => {
    const mun: Municipality = {
      ...baseMunicipality,
      phone: null,
      website: null,
      email: null,
      address: null,
    }
    const prompt = buildSystemPrompt(mun, 'context')
    expect(prompt).toContain('No disponible')
    // Should use fallback in "cuando no sabes" section
    expect(prompt).toContain('el sitio web del municipio')
    expect(prompt).toContain('teléfono del municipio')
  })

  it('should include system_prompt_override when set', () => {
    const mun: Municipality = {
      ...baseMunicipality,
      system_prompt_override: 'CUSTOM INSTRUCTION: Be extra formal.',
    }
    const prompt = buildSystemPrompt(mun, 'context')
    expect(prompt).toContain('CUSTOM INSTRUCTION: Be extra formal.')
  })

  it('should include rioplatense instruction', () => {
    const prompt = buildSystemPrompt(baseMunicipality, '')
    expect(prompt).toContain('rioplatense')
  })

  it('should include disclaimer section', () => {
    const prompt = buildSystemPrompt(baseMunicipality, '')
    expect(prompt).toContain('inteligencia artificial')
    expect(prompt).toContain('no estar 100% actualizadas')
  })

  it('should instruct not to cite sources automatically', () => {
    const prompt = buildSystemPrompt(baseMunicipality, '')
    expect(prompt).toContain('NO cites fuentes automáticamente')
  })
})
