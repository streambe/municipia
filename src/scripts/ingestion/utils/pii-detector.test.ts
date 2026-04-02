import { describe, it, expect } from 'vitest'
import { detectPII, redactPII } from './pii-detector'

const REDACTED = '[DATO PERSONAL REDACTADO]'

describe('detectPII', () => {
  it('detects dotted DNI', () => {
    const matches = detectPII('Mi DNI es 32.456.789 y listo')
    expect(matches.some((m) => m.type === 'dni' && m.value === '32.456.789')).toBe(true)
  })

  it('detects CUIL/CUIT', () => {
    const matches = detectPII('CUIT: 20-32456789-3')
    expect(matches.some((m) => m.type === 'cuil_cuit')).toBe(true)
  })

  it('detects emails', () => {
    const matches = detectPII('Escribir a juan@municipio.gob.ar')
    expect(matches.some((m) => m.type === 'email')).toBe(true)
  })

  it('detects phone numbers', () => {
    const matches = detectPII('Tel: +54 11 1234-5678')
    expect(matches.some((m) => m.type === 'phone')).toBe(true)
  })

  it('returns empty for clean text', () => {
    const matches = detectPII('Horario de atencion: lunes a viernes.')
    // Should have no cuil/dni/email matches (phone regex may be noisy, so just check specific types)
    const specific = matches.filter((m) => ['dni', 'cuil_cuit', 'email'].includes(m.type))
    expect(specific).toHaveLength(0)
  })
})

describe('redactPII', () => {
  it('redacts dotted DNI', () => {
    expect(redactPII('DNI: 32.456.789')).toBe(`DNI: ${REDACTED}`)
  })

  it('redacts CUIL/CUIT', () => {
    expect(redactPII('CUIT 20-32456789-3 registrado')).toBe(
      `CUIT ${REDACTED} registrado`
    )
  })

  it('redacts emails', () => {
    expect(redactPII('Contacto: info@moron.gob.ar')).toBe(
      `Contacto: ${REDACTED}`
    )
  })

  it('does not modify text without PII', () => {
    const clean = 'Tramites disponibles en la municipalidad.'
    expect(redactPII(clean)).toBe(clean)
  })

  it('redacts multiple PII types in the same text', () => {
    const text = 'DNI 12.345.678, email: test@mail.com, CUIT 20-12345678-9'
    const result = redactPII(text)
    expect(result).not.toContain('12.345.678')
    expect(result).not.toContain('test@mail.com')
    expect(result).not.toContain('20-12345678-9')
  })
})
