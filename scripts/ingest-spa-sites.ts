/**
 * Ingestion script for SPA-based municipal sites using Playwright.
 * Run: npx tsx scripts/ingest-spa-sites.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { scrapeWithPlaywright } from './ingestion/scrapers/municipal-web-playwright'
import { chunkDocument } from '../src/scripts/ingestion/utils/chunking'
import { redactPII } from '../src/scripts/ingestion/utils/pii-detector'
import { isDocumentChanged, upsertDocument, upsertChunks } from '../src/scripts/ingestion/utils/dedup'
import { generateEmbeddingBatch } from '../src/lib/ai/embeddings'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const SPA_MUNICIPALITIES = [
  { slug: 'san-isidro', name: 'San Isidro', baseUrl: 'https://www.sanisidro.gob.ar' },
  { slug: 'la-plata', name: 'La Plata', baseUrl: 'https://www.laplata.gob.ar' },
  { slug: 'tigre', name: 'Tigre', baseUrl: 'https://www.tigre.gob.ar' },
  { slug: 'ameghino', name: 'Florentino Ameghino', baseUrl: 'https://www.ameghino.gob.ar' },
]

async function main() {
  console.log('MunicipIA — SPA Ingestion (Playwright)\n')

  for (const muni of SPA_MUNICIPALITIES) {
    // Get municipality UUID from DB
    const { data: dbMuni } = await supabase
      .from('municipalities')
      .select('id')
      .eq('slug', muni.slug)
      .single()

    if (!dbMuni) {
      console.log(`❌ ${muni.name}: not found in DB, skipping`)
      continue
    }

    console.log(`\n📍 ${muni.name} (${muni.slug})`)
    console.log('─'.repeat(50))

    const pages = await scrapeWithPlaywright({
      baseUrl: muni.baseUrl,
      municipalityName: muni.name,
      maxPages: 100,
      rateLimit: 1500,
      maxDepth: 2,
    })

    console.log(`  Scraped ${pages.length} pages`)

    let newDocs = 0
    let newChunks = 0
    let skipped = 0
    let errors = 0

    for (const page of pages) {
      try {
        const changed = await isDocumentChanged(supabase, page.url, page.contentHash)
        if (!changed) {
          skipped++
          continue
        }

        const docId = await upsertDocument(supabase, {
          municipalityId: dbMuni.id,
          sourceType: 'web_playwright',
          url: page.url,
          title: page.title,
          contentHash: page.contentHash,
          contentLength: page.content.length,
        })

        const chunks = chunkDocument(page.content, {
          source_url: page.url,
          source_title: page.title,
          municipality_id: dbMuni.id,
        })

        if (chunks.length === 0) continue

        const cleanChunks = chunks.map(c => ({
          ...c,
          content: redactPII(c.content),
        }))

        const embeddings = await generateEmbeddingBatch(cleanChunks.map(c => c.content))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await upsertChunks(supabase, docId, dbMuni.id, cleanChunks as any, embeddings)

        newDocs++
        newChunks += chunks.length
      } catch (err) {
        errors++
        console.log(`  ⚠️ Error: ${(err as Error).message?.substring(0, 80)}`)
      }
    }

    console.log(`  ✅ ${muni.name}: ${newDocs} new docs, ${newChunks} chunks, ${skipped} skipped, ${errors} errors`)
  }

  console.log('\n✅ SPA ingestion complete')
}

main().catch(console.error)
