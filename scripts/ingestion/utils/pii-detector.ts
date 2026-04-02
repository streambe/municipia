/**
 * PII (Personally Identifiable Information) detector
 * Redacts sensitive data before storing in the database
 */

const PII_PATTERNS = [
  { name: 'DNI', pattern: /\b\d{2}\.?\d{3}\.?\d{3}\b/g, replacement: '[DNI REDACTADO]' },
  { name: 'EMAIL', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL REDACTADO]' },
  { name: 'PHONE', pattern: /\b(?:\+54|0)?\s*(?:11|[2-9]\d{2,3})\s*[-.]?\s*\d{4}\s*[-.]?\s*\d{4}\b/g, replacement: '[TELEFONO REDACTADO]' },
  { name: 'CUIL', pattern: /\b(?:20|23|24|27|30|33|34)-?\d{8}-?\d\b/g, replacement: '[CUIL REDACTADO]' },
]

export function detectAndRedactPII(text: string): { redacted: string; detectedTypes: string[] } {
  let redacted = text
  const detectedTypes: string[] = []

  for (const { name, pattern, replacement } of PII_PATTERNS) {
    if (pattern.test(redacted)) {
      detectedTypes.push(name)
      redacted = redacted.replace(pattern, replacement)
    }
  }

  return { redacted, detectedTypes }
}
