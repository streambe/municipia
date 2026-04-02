/**
 * MunicipIA Ingestion Pipeline — Main orchestrator.
 *
 * Scrapes municipal websites, queries CKAN portals, SIBOM and BA Abierta,
 * chunks content, generates embeddings, and upserts into Supabase.
 *
 * Usage:
 *   npx tsx src/scripts/ingestion/index.ts             # full run
 *   npx tsx src/scripts/ingestion/index.ts --dry-run   # scrape only, no DB writes
 */

import { createClient } from '@supabase/supabase-js'
import { scrapeMunicipality, type ScrapedPage } from './scrapers/municipal-web'
import { chunkDocument } from './utils/chunking'
import { redactPII } from './utils/pii-detector'
import { isDocumentChanged, upsertDocument, upsertChunks } from './utils/dedup'
import { generateEmbeddingBatch } from '../../lib/ai/embeddings'
import { ingestAllCKAN } from './connectors/ckan'
import { ingestSIBOM } from './connectors/sibom'
import { ingestBAAbierta } from './connectors/ba-abierta'
import { ingestPBAC } from './connectors/pbac'
import { ingestINDEC } from './connectors/indec'
import { ingestSocialMedia } from './connectors/social-media'
import { type IngestResult, type MunicipalityConfig, emptyResult } from './types'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export const MUNICIPALITIES: MunicipalityConfig[] = [
  { id: 'vicente-lopez', name: 'Vicente López', baseUrl: 'https://www.vicentelopez.gov.ar' },
  { id: 'san-isidro', name: 'San Isidro', baseUrl: 'https://www.sanisidro.gob.ar' },
  { id: 'moron', name: 'Morón', baseUrl: 'https://www.moron.gob.ar' },
  { id: 'la-plata', name: 'La Plata', baseUrl: 'https://www.laplata.gob.ar' },
  { id: 'lanus', name: 'Lanús', baseUrl: 'https://www.lanus.gob.ar' },
  { id: 'general-rodriguez', name: 'General Rodríguez', baseUrl: 'https://www.generalrodriguez.gob.ar' },
  { id: 'ameghino', name: 'Florentino Ameghino', baseUrl: 'https://www.ameghino.gob.ar' },
  { id: 'tigre', name: 'Tigre', baseUrl: 'https://www.tigre.gob.ar' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars'
    )
  }

  return createClient(url, key)
}

/**
 * Resolve the municipality UUID from the slug, or create a row if missing.
 */
async function resolveMunicipalityId(
  supabase: ReturnType<typeof createClient>,
  slug: string,
  name: string,
  website: string
): Promise<string> {
  const { data } = await supabase
    .from('municipalities')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (data) return (data as { id: string }).id

  const { data: inserted, error } = await supabase
    .from('municipalities')
    .insert({ slug, name, website, province: 'Buenos Aires' } as any)
    .select('id')
    .single()

  if (error) throw new Error(`Failed to create municipality ${slug}: ${error.message}`)
  return (inserted as { id: string }).id
}

/**
 * Log ingestion result to Supabase ingestion_logs table.
 */
async function logIngestion(
  supabase: ReturnType<typeof createClient>,
  municipalityId: string,
  source: string,
  result: IngestResult,
  startedAt: string
): Promise<void> {
  try {
    const status =
      result.errors.length === 0
        ? 'success'
        : result.pagesProcessed > 0
          ? 'partial'
          : 'failed'

    await supabase.from('ingestion_logs').insert({
      municipality_id: municipalityId,
      source,
      status,
      pages_processed: result.pagesProcessed,
      chunks_created: result.chunksCreated,
      errors: result.errors,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
    } as any)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`  [log] Failed to log ingestion for ${source}: ${msg}`)
  }
}

// ---------------------------------------------------------------------------
// Pipeline — Web scraper (existing logic, refactored)
// ---------------------------------------------------------------------------

interface PipelineStats {
  municipality: string
  sources: IngestResult[]
}

async function processWebScraper(
  supabase: ReturnType<typeof createClient> | null,
  muni: MunicipalityConfig,
  municipalityUuid: string | null,
  dryRun: boolean
): Promise<IngestResult> {
  const result = emptyResult('web', muni.id)
  const startTime = Date.now()

  console.log(`  [pipeline] Scraping ${muni.baseUrl}...`)
  let pages: ScrapedPage[]
  try {
    pages = await scrapeMunicipality({
      municipalityId: muni.id,
      municipalityName: muni.name,
      baseUrl: muni.baseUrl,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`  [pipeline] Scraping failed for ${muni.name}: ${msg}`)
    result.errors.push(msg)
    result.duration = Date.now() - startTime
    return result
  }

  result.pagesProcessed = pages.length
  console.log(`  [pipeline] Scraped ${pages.length} pages`)

  if (dryRun) {
    console.log(`  [pipeline] DRY RUN — skipping DB operations`)
    for (const p of pages.slice(0, 5)) {
      console.log(`    - ${p.title || '(no title)'} [${p.url}] (${p.content.length} chars)`)
    }
    if (pages.length > 5) console.log(`    ... and ${pages.length - 5} more`)
    result.duration = Date.now() - startTime
    return result
  }

  if (!supabase || !municipalityUuid) {
    result.duration = Date.now() - startTime
    return result
  }

  // Process each page
  for (const page of pages) {
    try {
      const changed = await isDocumentChanged(supabase, page.url, page.contentHash)
      if (!changed) {
        result.chunksSkipped++
        continue
      }

      const docId = await upsertDocument(supabase, {
        url: page.url,
        title: page.title,
        contentHash: page.contentHash,
        contentLength: page.content.length,
        municipalityId: municipalityUuid,
        sourceType: 'web',
        metadata: { scraped_at: page.scrapedAt },
      })

      const chunks = chunkDocument(page.content, {
        source_url: page.url,
        source_title: page.title,
        municipality_id: municipalityUuid,
      })

      if (chunks.length === 0) continue

      const cleanChunks = chunks.map((c) => ({
        ...c,
        content: redactPII(c.content),
      }))

      const embeddings = await generateEmbeddingBatch(
        cleanChunks.map((c) => c.content)
      )

      const inserted = await upsertChunks(
        supabase,
        docId,
        municipalityUuid,
        cleanChunks.map((c) => ({ content: c.content, metadata: c.metadata as unknown as Record<string, unknown> })),
        embeddings
      )

      result.chunksCreated += inserted
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  [pipeline] Error processing ${page.url}: ${msg}`)
      result.errors.push(msg)
    }
  }

  result.duration = Date.now() - startTime
  return result
}

// ---------------------------------------------------------------------------
// Pipeline — All connectors for one municipality
// ---------------------------------------------------------------------------

async function processMunicipality(
  supabase: ReturnType<typeof createClient> | null,
  muni: MunicipalityConfig,
  dryRun: boolean
): Promise<PipelineStats> {
  const stats: PipelineStats = {
    municipality: muni.name,
    sources: [],
  }

  let municipalityUuid: string | null = null
  if (!dryRun && supabase) {
    municipalityUuid = await resolveMunicipalityId(
      supabase,
      muni.id,
      muni.name,
      muni.baseUrl
    )
  }

  const startedAt = new Date().toISOString()

  // 1. Web scraper
  console.log(`\n  --- ${muni.name}: Web Scraper ---`)
  const webResult = await processWebScraper(supabase, muni, municipalityUuid, dryRun)
  stats.sources.push(webResult)
  if (!dryRun && supabase && municipalityUuid) {
    await logIngestion(supabase, municipalityUuid, 'web', webResult, startedAt)
  }

  // 2. CKAN connectors (PBA + Nacional)
  console.log(`\n  --- ${muni.name}: CKAN ---`)
  try {
    const ckanResults = await ingestAllCKAN(muni.id, muni.name)
    for (const cr of ckanResults) {
      stats.sources.push(cr)
      if (!dryRun && supabase && municipalityUuid) {
        await logIngestion(supabase, municipalityUuid, cr.source, cr, startedAt)
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`  [pipeline] CKAN failed for ${muni.name}: ${msg}`)
    const failedResult = emptyResult('ckan', muni.id)
    failedResult.errors.push(msg)
    stats.sources.push(failedResult)
  }

  // 3. SIBOM
  console.log(`\n  --- ${muni.name}: SIBOM ---`)
  try {
    const sibomResult = await ingestSIBOM(muni.name, muni.id)
    stats.sources.push(sibomResult)
    if (!dryRun && supabase && municipalityUuid) {
      await logIngestion(supabase, municipalityUuid, 'sibom', sibomResult, startedAt)
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`  [pipeline] SIBOM failed for ${muni.name}: ${msg}`)
    const failedResult = emptyResult('sibom', muni.id)
    failedResult.errors.push(msg)
    stats.sources.push(failedResult)
  }

  // 4. Buenos Aires Abierta
  console.log(`\n  --- ${muni.name}: BA Abierta ---`)
  try {
    const baResult = await ingestBAAbierta(muni.name, muni.id)
    stats.sources.push(baResult)
    if (!dryRun && supabase && municipalityUuid) {
      await logIngestion(supabase, municipalityUuid, 'ba_abierta', baResult, startedAt)
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`  [pipeline] BA Abierta failed for ${muni.name}: ${msg}`)
    const failedResult = emptyResult('ba_abierta', muni.id)
    failedResult.errors.push(msg)
    stats.sources.push(failedResult)
  }

  // 5. PBAC (Compras Publicas)
  console.log(`\n  --- ${muni.name}: PBAC ---`)
  try {
    const pbacResult = await ingestPBAC(muni.name, muni.id)
    stats.sources.push(pbacResult)
    if (!dryRun && supabase && municipalityUuid) {
      await logIngestion(supabase, municipalityUuid, 'pbac', pbacResult, startedAt)
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`  [pipeline] PBAC failed for ${muni.name}: ${msg}`)
    const failedResult = emptyResult('pbac', muni.id)
    failedResult.errors.push(msg)
    stats.sources.push(failedResult)
  }

  // 6. INDEC (Census data)
  console.log(`\n  --- ${muni.name}: INDEC ---`)
  try {
    const indecResult = await ingestINDEC(muni.name, muni.id)
    stats.sources.push(indecResult)
    if (!dryRun && supabase && municipalityUuid) {
      await logIngestion(supabase, municipalityUuid, 'indec', indecResult, startedAt)
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`  [pipeline] INDEC failed for ${muni.name}: ${msg}`)
    const failedResult = emptyResult('indec', muni.id)
    failedResult.errors.push(msg)
    stats.sources.push(failedResult)
  }

  // 7. Social Media
  console.log(`\n  --- ${muni.name}: Social Media ---`)
  try {
    const socialResult = await ingestSocialMedia(muni.name, muni.id)
    stats.sources.push(socialResult)
    if (!dryRun && supabase && municipalityUuid) {
      await logIngestion(supabase, municipalityUuid, 'social_media', socialResult, startedAt)
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`  [pipeline] Social Media failed for ${muni.name}: ${msg}`)
    const failedResult = emptyResult('social_media', muni.id)
    failedResult.errors.push(msg)
    stats.sources.push(failedResult)
  }

  return stats
}

// ---------------------------------------------------------------------------
// Summary helpers
// ---------------------------------------------------------------------------

function summarizeResults(sources: IngestResult[]): string {
  const totalPages = sources.reduce((s, r) => s + r.pagesProcessed, 0)
  const totalChunks = sources.reduce((s, r) => s + r.chunksCreated, 0)
  const totalErrors = sources.reduce((s, r) => s + r.errors.length, 0)
  const totalDuration = sources.reduce((s, r) => s + r.duration, 0)
  return `${totalPages} pages, ${totalChunks} chunks, ${totalErrors} errors, ${totalDuration}ms`
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  console.log('MunicipIA Ingestion Pipeline — Starting...')
  console.log(`Municipalities: ${MUNICIPALITIES.length}`)
  console.log(`Sources: web, ckan_pba, ckan_nacional, sibom, ba_abierta, pbac, indec, social_media`)
  if (dryRun) console.log('MODE: dry-run (no DB writes)')

  const supabase = dryRun ? null : createSupabaseAdmin()
  const allStats: PipelineStats[] = []

  for (const muni of MUNICIPALITIES) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Processing ${muni.name} (${muni.id})`)
    console.log('='.repeat(60))

    const stats = await processMunicipality(supabase as any, muni, dryRun)
    allStats.push(stats)

    console.log(`\n  Summary for ${muni.name}: ${summarizeResults(stats.sources)}`)
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log('Ingestion pipeline completed')
  console.log('='.repeat(60))
  console.log('\nPer-municipality summary:')
  for (const s of allStats) {
    console.log(`  ${s.municipality}: ${summarizeResults(s.sources)}`)
    for (const src of s.sources) {
      console.log(`    - ${src.source}: ${src.pagesProcessed} pages, ${src.chunksCreated} chunks, ${src.errors.length} errors`)
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
