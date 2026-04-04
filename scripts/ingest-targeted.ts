/**
 * Targeted ingestion script for MunicipIA.
 *
 * Fills topic gaps per municipality by:
 *   1. Scraping known direct URLs with Playwright
 *   2. Searching Google for topic-specific queries, then scraping results
 *
 * Uses existing dedup, chunking, PII redaction, and embedding utilities.
 *
 * Idempotent: skips URLs already stored with unchanged content hash.
 * Rate-limited: 5s between Google searches, 2s between page scrapes.
 */

import { chromium, type Browser, type Page } from 'playwright'
import { createHash } from 'crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(__dirname, '..', '.env.local') })

// Import project utilities — relative paths from scripts/ to src/
import { chunkDocument } from '../src/scripts/ingestion/utils/chunking'
import { isDocumentChanged, upsertDocument, upsertChunks } from '../src/scripts/ingestion/utils/dedup'
import { generateEmbeddingBatch } from '../src/lib/ai/embeddings'
import { redactPII } from '../src/scripts/ingestion/utils/pii-detector'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TopicSearch {
  municipalitySlug: string
  municipalityName: string
  topic: string
  queries: string[]
  directUrls: string[]
}

interface ScrapedResult {
  url: string
  title: string
  content: string
  contentHash: string
}

interface IngestSummary {
  municipality: string
  topic: string
  directUrlsScraped: number
  directUrlsSkipped: number
  googleQueriesRun: number
  googleResultsScraped: number
  googleResultsSkipped: number
  chunksStored: number
  errors: string[]
}

// ---------------------------------------------------------------------------
// Targeted searches configuration
// ---------------------------------------------------------------------------

const TARGETED_SEARCHES: TopicSearch[] = [
  // San Isidro - Transporte
  {
    municipalitySlug: 'san-isidro',
    municipalityName: 'San Isidro',
    topic: 'transporte',
    queries: [
      'San Isidro Buenos Aires transporte público colectivos',
      'San Isidro líneas de colectivo trenes',
      'como llegar San Isidro transporte',
    ],
    directUrls: ['https://www.sanisidro.gob.ar/movilidad'],
  },

  // Morón - Obras
  {
    municipalitySlug: 'moron',
    municipalityName: 'Morón',
    topic: 'obras',
    queries: [
      'Morón municipio obras públicas 2025 2026',
      'Morón infraestructura pavimentación',
      'obras municipales Morón Buenos Aires',
    ],
    directUrls: ['https://www.moron.gob.ar/obras'],
  },

  // General Rodríguez - Transporte
  {
    municipalitySlug: 'general-rodriguez',
    municipalityName: 'General Rodríguez',
    topic: 'transporte',
    queries: [
      'General Rodríguez transporte público colectivos',
      'General Rodríguez tren línea Sarmiento',
      'como llegar General Rodríguez',
    ],
    directUrls: [],
  },

  // Tigre - Presupuesto
  {
    municipalitySlug: 'tigre',
    municipalityName: 'Tigre',
    topic: 'presupuesto',
    queries: [
      'Tigre municipio presupuesto 2025 2026',
      'Tigre tasas municipales tributación',
      'Tigre ejecución presupuestaria',
    ],
    directUrls: ['https://www.tigre.gob.ar/gobierno/presupuesto'],
  },

  // Tigre - Medio Ambiente
  {
    municipalitySlug: 'tigre',
    municipalityName: 'Tigre',
    topic: 'medio_ambiente',
    queries: [
      'Tigre municipio medio ambiente sustentable',
      'Tigre reciclaje residuos separación',
      'Tigre reserva ecológica delta',
    ],
    directUrls: ['https://www.tigre.gob.ar/ambiente'],
  },

  // Tigre - Género
  {
    municipalitySlug: 'tigre',
    municipalityName: 'Tigre',
    topic: 'genero',
    queries: [
      'Tigre municipio género diversidad políticas',
      'Tigre violencia de género atención',
    ],
    directUrls: ['https://www.tigre.gob.ar/comunidad/genero'],
  },

  // Lanús - Obras
  {
    municipalitySlug: 'lanus',
    municipalityName: 'Lanús',
    topic: 'obras',
    queries: [
      'Lanús municipio obras públicas infraestructura',
      'Lanús pavimentación alumbrado 2025 2026',
    ],
    directUrls: ['https://www.lanus.gob.ar/obras'],
  },

  // Lanús - Transporte
  {
    municipalitySlug: 'lanus',
    municipalityName: 'Lanús',
    topic: 'transporte',
    queries: [
      'Lanús transporte público colectivos tren',
      'Lanús líneas colectivo Roca',
    ],
    directUrls: [],
  },

  // Lanús - Medio Ambiente
  {
    municipalitySlug: 'lanus',
    municipalityName: 'Lanús',
    topic: 'medio_ambiente',
    queries: [
      'Lanús medio ambiente reciclaje residuos',
      'Lanús separación basura puntos verdes',
    ],
    directUrls: [],
  },

  // Lanús - Contacto
  {
    municipalitySlug: 'lanus',
    municipalityName: 'Lanús',
    topic: 'contacto',
    queries: [
      'Lanús municipio teléfono horarios atención vecino',
      'Lanús delegaciones municipales direcciones',
    ],
    directUrls: [
      'https://www.lanus.gob.ar/contacto',
      'https://www.lanus.gob.ar/delegaciones',
    ],
  },

  // Lanús - Género
  {
    municipalitySlug: 'lanus',
    municipalityName: 'Lanús',
    topic: 'genero',
    queries: [
      'Lanús género diversidad política municipal',
      'Lanús atención violencia de género',
    ],
    directUrls: [],
  },

  // La Plata - General (all topics)
  {
    municipalitySlug: 'la-plata',
    municipalityName: 'La Plata',
    topic: 'general',
    queries: [
      'La Plata municipalidad trámites servicios vecino',
      'La Plata hospitales centros de salud municipales',
      'La Plata escuelas educación municipal',
      'La Plata cultura museos deportes municipal',
      'La Plata obras públicas infraestructura 2025 2026',
      'La Plata presupuesto municipal tasas tributarias',
      'La Plata seguridad comisarías',
      'La Plata transporte colectivos como llegar',
      'La Plata medio ambiente reciclaje',
      'La Plata municipalidad teléfono horarios contacto',
      'La Plata historia barrios localidades',
      'La Plata género diversidad políticas municipales',
    ],
    directUrls: [
      'https://www.laplata.gob.ar/tramites',
      'https://www.laplata.gob.ar/salud',
      'https://www.laplata.gob.ar/educacion',
      'https://www.laplata.gob.ar/cultura',
      'https://www.laplata.gob.ar/obras',
      'https://www.laplata.gob.ar/seguridad',
      'https://www.laplata.gob.ar/contacto',
    ],
  },

  // Ameghino - General (all topics)
  {
    municipalitySlug: 'ameghino',
    municipalityName: 'Florentino Ameghino',
    topic: 'general',
    queries: [
      'Florentino Ameghino municipio Buenos Aires trámites servicios',
      'Ameghino Buenos Aires hospital salud',
      'Ameghino Buenos Aires escuelas educación',
      'Ameghino Buenos Aires cultura deportes',
      'Ameghino Buenos Aires obras públicas',
      'Ameghino Buenos Aires presupuesto tasas',
      'Ameghino Buenos Aires seguridad comisaría',
      'Ameghino Buenos Aires transporte colectivos',
      'Ameghino Buenos Aires historia fundación',
      'Ameghino municipio teléfono contacto',
    ],
    directUrls: [
      'https://www.ameghino.gob.ar/municipio',
      'https://www.ameghino.gob.ar/gobierno-abierto',
      'https://www.ameghino.gob.ar/novedades',
    ],
  },
]

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USER_AGENT = 'MunicipIA/1.0 (https://municipia.org.ar; contacto@streambe.com)'
const GOOGLE_SEARCH_DELAY_MS = 5000
const PAGE_SCRAPE_DELAY_MS = 2000
const MIN_CONTENT_LENGTH = 100

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

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

// ---------------------------------------------------------------------------
// Google Search
// ---------------------------------------------------------------------------

async function searchGoogle(page: Page, query: string): Promise<string[]> {
  const searchUrl =
    'https://www.google.com/search?q=' + encodeURIComponent(query) + '&hl=es&gl=AR'

  try {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForTimeout(2000)

    // Check for CAPTCHA
    const pageContent = await page.content()
    if (
      pageContent.includes('captcha') ||
      pageContent.includes('unusual traffic') ||
      pageContent.includes('recaptcha')
    ) {
      console.warn(`  [google] CAPTCHA detected for query: "${query}" -- skipping`)
      return []
    }

    const urls = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]'))
        .map((a) => (a as HTMLAnchorElement).href)
        .filter(
          (h) =>
            h.startsWith('http') &&
            !h.includes('google.') &&
            !h.includes('youtube.') &&
            !h.includes('facebook.') &&
            !h.includes('instagram.') &&
            !h.includes('twitter.') &&
            !h.includes('x.com') &&
            !h.includes('accounts.google')
        )
        .slice(0, 10)
    })

    return Array.from(new Set(urls)).filter((u) => !isBlockedUrl(u))
  } catch (err) {
    console.warn(`  [google] Error searching "${query}": ${(err as Error).message?.substring(0, 80)}`)
    return []
  }
}

// ---------------------------------------------------------------------------
// Page Scraper
// ---------------------------------------------------------------------------

async function scrapePage(
  page: Page,
  url: string
): Promise<ScrapedResult | null> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForTimeout(1500)

    const { title, content } = await page.evaluate(() => {
      ;['script', 'style', 'nav', 'header', 'footer', 'iframe', 'noscript'].forEach((sel) =>
        document.querySelectorAll(sel).forEach((el) => el.remove())
      )
      return {
        title: document.title || '',
        content: (document.body?.innerText || '').replace(/\n{3,}/g, '\n\n').trim(),
      }
    })

    if (content.length < MIN_CONTENT_LENGTH) return null

    const contentHash = createHash('sha256').update(content).digest('hex')
    return { url, title, content, contentHash }
  } catch (err) {
    console.warn(`  [scrape] Error on ${url}: ${(err as Error).message?.substring(0, 80)}`)
    return null
  }
}

// ---------------------------------------------------------------------------
// Process a single scraped page: dedup, PII redact, chunk, embed, store
// ---------------------------------------------------------------------------

async function processAndStore(
  supabase: SupabaseClient,
  result: ScrapedResult,
  municipalityId: string,
  municipalitySlug: string,
  topic: string,
  sourceType: 'targeted_direct' | 'targeted_search'
): Promise<number> {
  // Dedup check
  const changed = await isDocumentChanged(supabase, result.url, result.contentHash)
  if (!changed) {
    console.log(`    [dedup] Unchanged, skip: ${result.url}`)
    return 0
  }

  // PII redaction
  const cleanContent = redactPII(result.content)

  // Chunk
  const chunks = chunkDocument(cleanContent, {
    source_url: result.url,
    source_title: result.title,
    municipality_id: municipalityId,
  })

  if (chunks.length === 0) return 0

  // Generate embeddings
  const texts = chunks.map((c) => c.content)
  const embeddings = await generateEmbeddingBatch(texts)

  // Upsert document
  const docId = await upsertDocument(supabase, {
    url: result.url,
    title: result.title,
    contentHash: result.contentHash,
    contentLength: cleanContent.length,
    municipalityId,
    sourceType,
    metadata: { topic, municipality_slug: municipalitySlug },
  })

  // Upsert chunks
  const chunkData = chunks.map((c) => ({
    content: c.content,
    metadata: { ...c.metadata, topic } as Record<string, unknown>,
  }))
  const stored = await upsertChunks(supabase, docId, municipalityId, chunkData, embeddings)

  console.log(`    [store] ${stored} chunks from: ${result.title?.substring(0, 60) || result.url}`)
  return stored
}

// ---------------------------------------------------------------------------
// Get municipality UUID from DB
// ---------------------------------------------------------------------------

async function getMunicipalityId(
  supabase: SupabaseClient,
  slug: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('municipalities')
    .select('id')
    .eq('slug', slug)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error(`  [db] Error fetching municipality "${slug}":`, error.message)
    return null
  }
  return data?.id ?? null
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== MunicipIA Targeted Ingestion ===\n')

  // Validate env
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const voyageKey = process.env.VOYAGE_API_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }
  if (!voyageKey) {
    console.error('Missing VOYAGE_API_KEY in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Launch browser
  console.log('[browser] Launching Playwright...')
  const browser: Browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    viewport: { width: 1280, height: 720 },
    locale: 'es-AR',
  })

  const summaries: IngestSummary[] = []

  try {
    for (const search of TARGETED_SEARCHES) {
      console.log(`\n--- ${search.municipalityName} / ${search.topic} ---`)

      const municipalityId = await getMunicipalityId(supabase, search.municipalitySlug)
      if (!municipalityId) {
        console.error(`  Municipality "${search.municipalitySlug}" not found in DB -- skipping`)
        summaries.push({
          municipality: search.municipalityName,
          topic: search.topic,
          directUrlsScraped: 0,
          directUrlsSkipped: 0,
          googleQueriesRun: 0,
          googleResultsScraped: 0,
          googleResultsSkipped: 0,
          chunksStored: 0,
          errors: [`Municipality slug "${search.municipalitySlug}" not found in DB`],
        })
        continue
      }

      const summary: IngestSummary = {
        municipality: search.municipalityName,
        topic: search.topic,
        directUrlsScraped: 0,
        directUrlsSkipped: 0,
        googleQueriesRun: 0,
        googleResultsScraped: 0,
        googleResultsSkipped: 0,
        chunksStored: 0,
        errors: [],
      }

      const processedUrls = new Set<string>()

      // --- Phase 1: Direct URLs ---
      if (search.directUrls.length > 0) {
        console.log(`  [direct] Scraping ${search.directUrls.length} direct URL(s)...`)
        const page = await context.newPage()

        for (const url of search.directUrls) {
          if (processedUrls.has(url)) continue
          processedUrls.add(url)

          const result = await scrapePage(page, url)
          if (!result) {
            summary.directUrlsSkipped++
            continue
          }

          try {
            const chunks = await processAndStore(
              supabase,
              result,
              municipalityId,
              search.municipalitySlug,
              search.topic,
              'targeted_direct'
            )
            if (chunks > 0) {
              summary.directUrlsScraped++
              summary.chunksStored += chunks
            } else {
              summary.directUrlsSkipped++
            }
          } catch (err) {
            const msg = `Direct URL error ${url}: ${(err as Error).message?.substring(0, 100)}`
            console.error(`    [error] ${msg}`)
            summary.errors.push(msg)
          }

          await sleep(PAGE_SCRAPE_DELAY_MS)
        }

        await page.close()
      }

      // --- Phase 2: Google Search ---
      if (search.queries.length > 0) {
        console.log(`  [google] Running ${search.queries.length} search(es)...`)
        const searchPage = await context.newPage()

        for (const query of search.queries) {
          console.log(`  [google] Query: "${query}"`)
          summary.googleQueriesRun++

          const urls = await searchGoogle(searchPage, query)
          console.log(`  [google] Found ${urls.length} result URL(s)`)

          // Scrape each result in a separate page
          const scrapePage2 = await context.newPage()

          for (const url of urls) {
            if (processedUrls.has(url) || isBlockedUrl(url)) continue
            processedUrls.add(url)

            const result = await scrapePage(scrapePage2, url)
            if (!result) {
              summary.googleResultsSkipped++
              continue
            }

            try {
              const chunks = await processAndStore(
                supabase,
                result,
                municipalityId,
                search.municipalitySlug,
                search.topic,
                'targeted_search'
              )
              if (chunks > 0) {
                summary.googleResultsScraped++
                summary.chunksStored += chunks
              } else {
                summary.googleResultsSkipped++
              }
            } catch (err) {
              const msg = `Google result error ${url}: ${(err as Error).message?.substring(0, 100)}`
              console.error(`    [error] ${msg}`)
              summary.errors.push(msg)
            }

            await sleep(PAGE_SCRAPE_DELAY_MS)
          }

          await scrapePage2.close()
          await sleep(GOOGLE_SEARCH_DELAY_MS)
        }

        await searchPage.close()
      }

      summaries.push(summary)
    }
  } finally {
    await browser.close()
    console.log('\n[browser] Closed.')
  }

  // --- Print Summary ---
  console.log('\n========== INGESTION SUMMARY ==========\n')

  let totalChunks = 0
  let totalDirectScraped = 0
  let totalGoogleScraped = 0
  let totalErrors = 0

  for (const s of summaries) {
    console.log(`${s.municipality} / ${s.topic}:`)
    console.log(`  Direct URLs: ${s.directUrlsScraped} scraped, ${s.directUrlsSkipped} skipped`)
    console.log(`  Google: ${s.googleQueriesRun} queries, ${s.googleResultsScraped} scraped, ${s.googleResultsSkipped} skipped`)
    console.log(`  Chunks stored: ${s.chunksStored}`)
    if (s.errors.length > 0) {
      console.log(`  Errors (${s.errors.length}):`)
      s.errors.forEach((e) => console.log(`    - ${e}`))
    }
    console.log()

    totalChunks += s.chunksStored
    totalDirectScraped += s.directUrlsScraped
    totalGoogleScraped += s.googleResultsScraped
    totalErrors += s.errors.length
  }

  console.log('--- TOTALS ---')
  console.log(`  Direct pages scraped: ${totalDirectScraped}`)
  console.log(`  Google pages scraped: ${totalGoogleScraped}`)
  console.log(`  Total chunks stored:  ${totalChunks}`)
  console.log(`  Total errors:         ${totalErrors}`)
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
