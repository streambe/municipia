/**
 * PII detection and redaction for Argentine personal data.
 *
 * Detects: DNI, CUIL/CUIT, emails, phone numbers, street addresses with numbers.
 */

const REDACTED = '[DATO PERSONAL REDACTADO]'

export interface PIIMatch {
  type: string
  value: string
  position: number
}

// --- Patterns -----------------------------------------------------------

// DNI: 12.345.678 or 12345678 (7-8 digits)
const DNI_DOTTED = /\b\d{1,2}\.\d{3}\.\d{3}\b/g
const DNI_PLAIN = /\b(?<!\d[.-])\d{7,8}(?![.-]\d)\b/g

// CUIL/CUIT: 20-12345678-9
const CUIL_CUIT = /\b\d{2}-\d{7,8}-\d{1}\b/g

// Email
const EMAIL = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g

// Argentine phone numbers: +54 11 1234-5678, 011 15 1234-5678, etc.
const PHONE =
  /(?:\+54\s?)?(?:\(?\d{2,4}\)?[\s-]?)?(?:15[\s-]?)?\d{4}[\s-]?\d{4}\b/g

// Addresses: "Av. San Martín 1234", "Calle Rivadavia 567", etc.
const ADDRESS =
  /(?:(?:Av\.?|Avenida|Calle|Bvd?\.?|Boulevard|Pasaje|Pje\.?|Diagonal|Diag\.?)\s+)?[A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\s.]+\s+\d{1,5}(?:\s*(?:,?\s*(?:Piso|Depto?\.?|P\.?B\.?|Dto\.?)[\s.]*\w*))?/g

/**
 * Detect all PII occurrences in the text.
 */
export function detectPII(text: string): PIIMatch[] {
  const matches: PIIMatch[] = []

  const run = (regex: RegExp, type: string) => {
    const r = new RegExp(regex.source, regex.flags)
    let m: RegExpExecArray | null
    while ((m = r.exec(text)) !== null) {
      matches.push({ type, value: m[0], position: m.index })
    }
  }

  run(CUIL_CUIT, 'cuil_cuit')
  run(DNI_DOTTED, 'dni')
  run(EMAIL, 'email')
  run(PHONE, 'phone')
  run(ADDRESS, 'address')

  // DNI plain is noisy — only flag 8-digit numbers not already matched as CUIL
  const cuilPositions = new Set(
    matches.filter((m) => m.type === 'cuil_cuit').map((m) => m.position)
  )
  const r = new RegExp(DNI_PLAIN.source, DNI_PLAIN.flags)
  let m: RegExpExecArray | null
  while ((m = r.exec(text)) !== null) {
    if (!cuilPositions.has(m.index)) {
      matches.push({ type: 'dni', value: m[0], position: m.index })
    }
  }

  // Sort by position
  matches.sort((a, b) => a.position - b.position)
  return matches
}

/**
 * Redact all detected PII from the text, replacing with a generic placeholder.
 */
export function redactPII(text: string): string {
  let result = text

  // Order matters: replace longer patterns first to avoid partial matches
  // CUIL/CUIT before DNI (CUIL contains DNI-like numbers)
  result = result.replace(CUIL_CUIT, REDACTED)
  result = result.replace(DNI_DOTTED, REDACTED)
  result = result.replace(EMAIL, REDACTED)
  result = result.replace(PHONE, REDACTED)
  // Addresses are intentionally not redacted automatically because the
  // heuristic is too broad and would remove valid municipal address info.
  // We detect them but only redact on explicit request.

  return result
}
