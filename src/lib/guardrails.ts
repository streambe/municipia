/**
 * Guardrails against prompt injection attacks.
 *
 * Uses pattern matching with weighted scoring to detect and block:
 * - Instruction override attempts
 * - System prompt extraction attempts
 * - Jailbreak attempts
 * - Role injection attempts
 */

export interface GuardrailResult {
  safe: boolean
  reason?: string
  score?: number
  matchedCategory?: string
}

interface PatternRule {
  pattern: RegExp
  weight: number
  category: string
}

const BLOCKED_RESPONSE =
  'No puedo responder a ese tipo de solicitud. Estoy aca para ayudarte con informacion sobre tu municipio. En que te puedo ayudar?'

const THRESHOLD = 1.0

const PATTERNS: PatternRule[] = [
  // --- Instruction override (ES + EN) ---
  { pattern: /ignor[aá]\s+(tus|las|todas?\s+las?)\s+instrucciones/i, weight: 1.5, category: 'instruction_override' },
  { pattern: /ignore\s+(all\s+)?(previous|prior|above|system)\s+(instructions|prompts|rules)/i, weight: 1.5, category: 'instruction_override' },
  { pattern: /olvid[aá]\s+(todo|tus\s+instrucciones|lo\s+anterior)/i, weight: 1.5, category: 'instruction_override' },
  { pattern: /forget\s+(all|your|everything|previous)/i, weight: 1.2, category: 'instruction_override' },
  { pattern: /disregard\s+(all|your|previous|prior)/i, weight: 1.2, category: 'instruction_override' },
  { pattern: /override\s+(your|the|all)\s+(instructions|rules|prompt)/i, weight: 1.5, category: 'instruction_override' },
  { pattern: /no\s+sigas\s+(esas|tus|las)\s+(instrucciones|reglas)/i, weight: 1.5, category: 'instruction_override' },
  { pattern: /dej[aá]\s+de\s+seguir\s+(tus|las|esas)\s+(instrucciones|reglas)/i, weight: 1.5, category: 'instruction_override' },

  // --- System prompt extraction ---
  { pattern: /cu[aá]l\s+es\s+tu\s+prompt/i, weight: 1.5, category: 'prompt_extraction' },
  { pattern: /show\s+me\s+your\s+(instructions|prompt|system\s*prompt|rules)/i, weight: 1.5, category: 'prompt_extraction' },
  { pattern: /system\s*prompt/i, weight: 0.8, category: 'prompt_extraction' },
  { pattern: /instrucciones\s+de\s+sistema/i, weight: 1.2, category: 'prompt_extraction' },
  { pattern: /repet[ií]\s+(tu\s+)?prompt/i, weight: 1.5, category: 'prompt_extraction' },
  { pattern: /print\s+your\s+(system\s*)?(prompt|instructions|message)/i, weight: 1.5, category: 'prompt_extraction' },
  { pattern: /dame\s+tu\s+prompt/i, weight: 1.5, category: 'prompt_extraction' },
  { pattern: /reveal\s+(your|the)\s+(system\s*)?(prompt|instructions)/i, weight: 1.5, category: 'prompt_extraction' },
  { pattern: /output\s+(your|the)\s+(initial|system|first)\s+(prompt|instructions|message)/i, weight: 1.5, category: 'prompt_extraction' },
  { pattern: /mostr[aá]me\s+tus\s+instrucciones/i, weight: 1.5, category: 'prompt_extraction' },

  // --- Jailbreak ---
  { pattern: /\bDAN\s+mode\b/i, weight: 2.0, category: 'jailbreak' },
  { pattern: /\bdeveloper\s+mode\b/i, weight: 1.5, category: 'jailbreak' },
  { pattern: /\bmodo\s+desarrollador\b/i, weight: 1.5, category: 'jailbreak' },
  { pattern: /\bpretend\s+you\s+are\b/i, weight: 1.0, category: 'jailbreak' },
  { pattern: /\bjailbreak\b/i, weight: 1.5, category: 'jailbreak' },
  { pattern: /\bdo\s+anything\s+now\b/i, weight: 2.0, category: 'jailbreak' },
  { pattern: /\bact\s+as\s+an?\s+unrestricted\b/i, weight: 1.5, category: 'jailbreak' },
  { pattern: /\bsin\s+restricciones\b/i, weight: 1.0, category: 'jailbreak' },
  { pattern: /\bsin\s+filtros?\b/i, weight: 0.8, category: 'jailbreak' },
  { pattern: /\bno\s+ethical\s+(guidelines|restrictions|boundaries)\b/i, weight: 1.5, category: 'jailbreak' },
  { pattern: /\bwithout\s+ethical\s+(guidelines|restrictions|boundaries)\b/i, weight: 1.5, category: 'jailbreak' },

  // --- Role injection ---
  { pattern: /\byou\s+are\s+now\b/i, weight: 1.0, category: 'role_injection' },
  { pattern: /\bsos\s+ahora\b/i, weight: 1.0, category: 'role_injection' },
  { pattern: /\ba\s+partir\s+de\s+ahora\s+sos\b/i, weight: 1.5, category: 'role_injection' },
  { pattern: /\bactu[aá]\s+como\b/i, weight: 0.8, category: 'role_injection' },
  { pattern: /\bfrom\s+now\s+on\s+you\s+are\b/i, weight: 1.5, category: 'role_injection' },
  { pattern: /\byour\s+new\s+role\s+is\b/i, weight: 1.5, category: 'role_injection' },
  { pattern: /\btu\s+nuevo\s+rol\s+es\b/i, weight: 1.5, category: 'role_injection' },
  { pattern: /\brespond\s+as\s+if\s+you\s+were\b/i, weight: 1.0, category: 'role_injection' },
  { pattern: /\brespond[eé]\s+como\s+si\s+fueras\b/i, weight: 1.0, category: 'role_injection' },
]

/**
 * Checks a user message for prompt injection patterns.
 * Returns { safe: true } if the message is clean, or { safe: false, reason, score, matchedCategory }
 * if injection is detected.
 */
export function checkPromptInjection(message: string): GuardrailResult {
  if (!message || typeof message !== 'string') {
    return { safe: true }
  }

  // Normalize: collapse whitespace, trim
  const normalized = message.replace(/\s+/g, ' ').trim()

  let totalScore = 0
  let topCategory = ''
  let topWeight = 0

  for (const rule of PATTERNS) {
    if (rule.pattern.test(normalized)) {
      totalScore += rule.weight
      if (rule.weight > topWeight) {
        topWeight = rule.weight
        topCategory = rule.category
      }
    }
  }

  if (totalScore >= THRESHOLD) {
    return {
      safe: false,
      reason: BLOCKED_RESPONSE,
      score: totalScore,
      matchedCategory: topCategory,
    }
  }

  return { safe: true, score: totalScore }
}
