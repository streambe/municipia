import { describe, it, expect } from 'vitest'
import { redactPII } from '@/lib/pii'

const REDACTED = '[DATO PERSONAL REDACTADO]'

describe('redactPII (Edge-compatible)', () => {
  // --- Happy path ---
  it('should redact DNI with dots (XX.XXX.XXX)', () => {
    const result = redactPII('Mi DNI es 32.456.789')
    expect(result).toContain(REDACTED)
    expect(result).not.toContain('32.456.789')
  })

  it('should redact CUIL/CUIT (XX-XXXXXXXX-X)', () => {
    const result = redactPII('Mi CUIL es 20-32456789-4')
    expect(result).toContain(REDACTED)
    expect(result).not.toContain('20-32456789-4')
  })

  it('should redact email addresses', () => {
    const result = redactPII('Mi mail es juan@gmail.com')
    expect(result).toContain(REDACTED)
    expect(result).not.toContain('juan@gmail.com')
  })

  it('should redact Argentine phone numbers', () => {
    const result = redactPII('Llamame al 011 4512 3131')
    expect(result).toContain(REDACTED)
  })

  it('should redact phone with +54 prefix', () => {
    const result = redactPII('Mi cel es +5411 2345 6789')
    expect(result).toContain(REDACTED)
  })

  // --- No PII ---
  it('should not modify text without PII', () => {
    const text = 'Necesito informacion sobre habilitaciones comerciales'
    expect(redactPII(text)).toBe(text)
  })

  // --- Multiple PII ---
  it('should handle multiple PII patterns in same text', () => {
    const text = 'Soy Juan, DNI 32.456.789, mail: juan@mail.com, CUIL 20-32456789-4'
    const result = redactPII(text)
    expect(result).not.toContain('32.456.789')
    expect(result).not.toContain('juan@mail.com')
    expect(result).not.toContain('20-32456789-4')
  })

  // --- Edge cases ---
  it('should handle empty string', () => {
    expect(redactPII('')).toBe('')
  })

  it('should preserve surrounding text', () => {
    const result = redactPII('Hola, mi mail es test@example.com y necesito ayuda')
    expect(result).toContain('Hola, mi mail es')
    expect(result).toContain('y necesito ayuda')
  })
})
