/**
 * PII redaction for Edge Runtime.
 * Detects and redacts Argentine personal data: DNI, CUIL/CUIT, emails, phone numbers.
 * Pure regex-based, no Node.js modules — safe for Edge/Vercel.
 */

const REDACTED = '[DATO PERSONAL REDACTADO]'

// DNI: 12.345.678 or 12345678 (7-8 digits)
const DNI_DOTTED = /\b\d{1,2}\.\d{3}\.\d{3}\b/g
const DNI_PLAIN = /\b\d{7,8}\b/g

// CUIL/CUIT: 20-12345678-9
const CUIL_CUIT = /\b\d{2}-\d{7,8}-\d{1}\b/g

// Email
const EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

// Argentine phone numbers: +54 11 1234-5678, 011 15 1234-5678, etc.
const PHONE =
  /(?:\+54\s?)?(?:\(?\d{2,4}\)?[\s-]?)?(?:15[\s-]?)?\d{4}[\s-]?\d{4}\b/g

/**
 * Redact all detected PII from text, replacing with a generic placeholder.
 * Order: CUIL/CUIT first (contains DNI-like numbers), then DNI, email, phone.
 * Edge Runtime compatible — no Node.js imports.
 */
export function redactPII(text: string): string {
  let result = text
  result = result.replace(CUIL_CUIT, REDACTED)
  result = result.replace(DNI_DOTTED, REDACTED)
  result = result.replace(EMAIL, REDACTED)
  result = result.replace(PHONE, REDACTED)
  return result
}
