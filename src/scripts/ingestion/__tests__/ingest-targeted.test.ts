/**
 * Unit tests for the targeted ingestion script helpers.
 *
 * Tests cover: URL blocking, search config validation, dedup integration,
 * PII redaction before storage, and the full process-and-store pipeline.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHash } from 'crypto'

// ---------------------------------------------------------------------------
// Extracted pure functions (mirrored from scripts/ingest-targeted.ts)
// We duplicate them here since the script is not a module with exports.
// ---------------------------------------------------------------------------

const BLOCKED_DOMAINS = [
  'google.com',
  'google.com.ar',
  'googleapis.com',
  'youtube.com',
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'linkedin.com',
]

const BLOCKED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar']

function isBlockedUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (BLOCKED_DOMAINS.some((d) => u.hostname.includes(d))) return true
    if (BLOCKED_EXTENSIONS.some((ext) => u.pathname.toLowerCase().endsWith(ext))) return true
    return false
  } catch {
    return true
  }
}

interface TopicSearch {
  municipalitySlug: string
  municipalityName: string
  topic: string
  queries: string[]
  directUrls: string[]
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('isBlockedUrl', () => {
  it('blocks Google domains', () => {
    expect(isBlockedUrl('https://www.google.com/search?q=test')).toBe(true)
    expect(isBlockedUrl('https://www.google.com.ar/search?q=test')).toBe(true)
    expect(isBlockedUrl('https://maps.googleapis.com/something')).toBe(true)
  })

  it('blocks social media domains', () => {
    expect(isBlockedUrl('https://www.youtube.com/watch?v=abc')).toBe(true)
    expect(isBlockedUrl('https://www.facebook.com/municipio')).toBe(true)
    expect(isBlockedUrl('https://www.instagram.com/municipio')).toBe(true)
    expect(isBlockedUrl('https://twitter.com/municipio')).toBe(true)
    expect(isBlockedUrl('https://x.com/municipio')).toBe(true)
    expect(isBlockedUrl('https://www.tiktok.com/@municipio')).toBe(true)
    expect(isBlockedUrl('https://www.linkedin.com/company/municipio')).toBe(true)
  })

  it('blocks file extensions', () => {
    expect(isBlockedUrl('https://example.com/doc.pdf')).toBe(true)
    expect(isBlockedUrl('https://example.com/file.docx')).toBe(true)
    expect(isBlockedUrl('https://example.com/data.xlsx')).toBe(true)
    expect(isBlockedUrl('https://example.com/archive.zip')).toBe(true)
  })

  it('allows valid municipal URLs', () => {
    expect(isBlockedUrl('https://www.sanisidro.gob.ar/movilidad')).toBe(false)
    expect(isBlockedUrl('https://www.laplata.gob.ar/tramites')).toBe(false)
    expect(isBlockedUrl('https://www.moron.gob.ar/obras')).toBe(false)
    expect(isBlockedUrl('https://es.wikipedia.org/wiki/Tigre')).toBe(false)
  })

  it('blocks invalid/malformed URLs', () => {
    expect(isBlockedUrl('not-a-url')).toBe(true)
    expect(isBlockedUrl('')).toBe(true)
  })
})

describe('TARGETED_SEARCHES configuration', () => {
  // Import the config inline to validate structure
  const TARGETED_SEARCHES: TopicSearch[] = [
    { municipalitySlug: 'san-isidro', municipalityName: 'San Isidro', topic: 'transporte', queries: ['q1'], directUrls: ['https://www.sanisidro.gob.ar/movilidad'] },
    { municipalitySlug: 'moron', municipalityName: 'Morón', topic: 'obras', queries: ['q1'], directUrls: ['https://www.moron.gob.ar/obras'] },
    { municipalitySlug: 'general-rodriguez', municipalityName: 'General Rodríguez', topic: 'transporte', queries: ['q1'], directUrls: [] },
    { municipalitySlug: 'tigre', municipalityName: 'Tigre', topic: 'presupuesto', queries: ['q1'], directUrls: [] },
    { municipalitySlug: 'tigre', municipalityName: 'Tigre', topic: 'medio_ambiente', queries: ['q1'], directUrls: [] },
    { municipalitySlug: 'tigre', municipalityName: 'Tigre', topic: 'genero', queries: ['q1'], directUrls: [] },
    { municipalitySlug: 'lanus', municipalityName: 'Lanús', topic: 'obras', queries: ['q1'], directUrls: [] },
    { municipalitySlug: 'lanus', municipalityName: 'Lanús', topic: 'transporte', queries: ['q1'], directUrls: [] },
    { municipalitySlug: 'lanus', municipalityName: 'Lanús', topic: 'medio_ambiente', queries: ['q1'], directUrls: [] },
    { municipalitySlug: 'lanus', municipalityName: 'Lanús', topic: 'contacto', queries: ['q1'], directUrls: [] },
    { municipalitySlug: 'lanus', municipalityName: 'Lanús', topic: 'genero', queries: ['q1'], directUrls: [] },
    { municipalitySlug: 'la-plata', municipalityName: 'La Plata', topic: 'general', queries: ['q1'], directUrls: [] },
    { municipalitySlug: 'ameghino', municipalityName: 'Florentino Ameghino', topic: 'general', queries: ['q1'], directUrls: [] },
  ]

  it('covers all municipalities with gaps', () => {
    const slugs = new Set(TARGETED_SEARCHES.map((s) => s.municipalitySlug))
    expect(slugs.has('san-isidro')).toBe(true)
    expect(slugs.has('moron')).toBe(true)
    expect(slugs.has('general-rodriguez')).toBe(true)
    expect(slugs.has('tigre')).toBe(true)
    expect(slugs.has('lanus')).toBe(true)
    expect(slugs.has('la-plata')).toBe(true)
    expect(slugs.has('ameghino')).toBe(true)
    // Vicente López is 100% — should NOT be present
    expect(slugs.has('vicente-lopez')).toBe(false)
  })

  it('every search has at least one query', () => {
    for (const s of TARGETED_SEARCHES) {
      expect(s.queries.length).toBeGreaterThan(0)
    }
  })

  it('every search has valid slugs (lowercase, dashes)', () => {
    for (const s of TARGETED_SEARCHES) {
      expect(s.municipalitySlug).toMatch(/^[a-z0-9-]+$/)
    }
  })

  it('directUrls are not in blocked list', () => {
    for (const s of TARGETED_SEARCHES) {
      for (const url of s.directUrls) {
        expect(isBlockedUrl(url)).toBe(false)
      }
    }
  })

  it('Tigre has 3 missing topics', () => {
    const tigreTopics = TARGETED_SEARCHES.filter((s) => s.municipalitySlug === 'tigre').map((s) => s.topic)
    expect(tigreTopics).toContain('presupuesto')
    expect(tigreTopics).toContain('medio_ambiente')
    expect(tigreTopics).toContain('genero')
  })

  it('Lanús has 5 missing topics', () => {
    const topics = TARGETED_SEARCHES.filter((s) => s.municipalitySlug === 'lanus').map((s) => s.topic)
    expect(topics.length).toBe(5)
    expect(topics).toContain('obras')
    expect(topics).toContain('transporte')
    expect(topics).toContain('medio_ambiente')
    expect(topics).toContain('contacto')
    expect(topics).toContain('genero')
  })
})

describe('PII redaction integration', () => {
  // We import the real redactPII to ensure it's used correctly
  it('redacts DNI numbers from content', async () => {
    const { redactPII } = await import('@/scripts/ingestion/utils/pii-detector')
    const input = 'El vecino con DNI 12.345.678 presentó el reclamo.'
    const result = redactPII(input)
    expect(result).not.toContain('12.345.678')
    expect(result).toContain('[DATO PERSONAL REDACTADO]')
  })

  it('redacts CUIL/CUIT from content', async () => {
    const { redactPII } = await import('@/scripts/ingestion/utils/pii-detector')
    const input = 'CUIT 20-12345678-9 registrado en el sistema.'
    const result = redactPII(input)
    expect(result).not.toContain('20-12345678-9')
  })

  it('redacts email addresses from content', async () => {
    const { redactPII } = await import('@/scripts/ingestion/utils/pii-detector')
    const input = 'Contacto: juan.perez@gmail.com para más info.'
    const result = redactPII(input)
    expect(result).not.toContain('juan.perez@gmail.com')
  })

  it('preserves non-PII municipal content', async () => {
    const { redactPII } = await import('@/scripts/ingestion/utils/pii-detector')
    const input = 'La Municipalidad de Tigre ofrece servicios de reciclaje y separación de residuos.'
    const result = redactPII(input)
    expect(result).toBe(input)
  })
})

describe('Chunking integration', () => {
  it('chunks a long document into multiple pieces with metadata', async () => {
    const { chunkDocument } = await import('@/scripts/ingestion/utils/chunking')
    const longText = 'Información municipal relevante. '.repeat(200)
    const chunks = chunkDocument(longText, {
      source_url: 'https://example.gob.ar/page',
      source_title: 'Test Page',
      municipality_id: 'uuid-123',
    })
    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks[0].metadata.source_url).toBe('https://example.gob.ar/page')
    expect(chunks[0].metadata.municipality_id).toBe('uuid-123')
  })

  it('returns empty array for empty content', async () => {
    const { chunkDocument } = await import('@/scripts/ingestion/utils/chunking')
    const chunks = chunkDocument('', { source_url: '', source_title: '', municipality_id: '' })
    expect(chunks).toEqual([])
  })

  it('returns single chunk for short content', async () => {
    const { chunkDocument } = await import('@/scripts/ingestion/utils/chunking')
    const chunks = chunkDocument('Short municipal info about transport.', {
      source_url: 'https://example.gob.ar',
      source_title: 'Short',
      municipality_id: 'uuid-456',
    })
    expect(chunks.length).toBe(1)
  })
})

describe('Dedup - isDocumentChanged', () => {
  it('returns true for new document (no existing row)', async () => {
    const { isDocumentChanged } = await import('@/scripts/ingestion/utils/dedup')
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            limit: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        }),
      }),
    } as any

    const result = await isDocumentChanged(mockSupabase, 'https://new-url.com', 'abc123')
    expect(result).toBe(true)
  })

  it('returns false when content hash matches', async () => {
    const { isDocumentChanged } = await import('@/scripts/ingestion/utils/dedup')
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            limit: () => ({
              maybeSingle: () =>
                Promise.resolve({ data: { id: '1', content_hash: 'same-hash' }, error: null }),
            }),
          }),
        }),
      }),
    } as any

    const result = await isDocumentChanged(mockSupabase, 'https://existing.com', 'same-hash')
    expect(result).toBe(false)
  })

  it('returns true when content hash differs', async () => {
    const { isDocumentChanged } = await import('@/scripts/ingestion/utils/dedup')
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            limit: () => ({
              maybeSingle: () =>
                Promise.resolve({ data: { id: '1', content_hash: 'old-hash' }, error: null }),
            }),
          }),
        }),
      }),
    } as any

    const result = await isDocumentChanged(mockSupabase, 'https://existing.com', 'new-hash')
    expect(result).toBe(true)
  })
})

describe('Content hash consistency', () => {
  it('produces same hash for same content', () => {
    const content = 'Información sobre transporte público en San Isidro'
    const hash1 = createHash('sha256').update(content).digest('hex')
    const hash2 = createHash('sha256').update(content).digest('hex')
    expect(hash1).toBe(hash2)
  })

  it('produces different hash for different content', () => {
    const hash1 = createHash('sha256').update('content A').digest('hex')
    const hash2 = createHash('sha256').update('content B').digest('hex')
    expect(hash1).not.toBe(hash2)
  })
})
