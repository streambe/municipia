/**
 * SIBOM connector — Sistema de Informacion de Boletines Oficiales Municipales.
 *
 * Attempts to scrape boletines from SIBOM for a given municipality.
 * If the portal is not accessible or the structure is unknown,
 * returns an empty result with a warning (never crashes).
 */

import * as cheerio from 'cheerio'
import { emptyResult, type IngestResult } from '../types'

const USER_AGENT = 'MunicipIA/1.0 (https://municipia.org.ar)'
const REQUEST_TIMEOUT = 15_000
const RATE_LIMIT_MS = 1000
const SIBOM_BASE_URL = 'https://www.gob.gba.gob.ar/dijl/SIBOM'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

interface FetchPageResult {
  ok: boolean
  status: number
  html: string
  url: string
}

async function fetchPage(url: string): Promise<FetchPageResult> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      redirect: 'follow',
    })
    const html = res.ok ? await res.text() : ''
    return { ok: res.ok, status: res.status, html, url }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`  [sibom] Error fetching ${url}: ${msg}`)
    return { ok: false, status: 0, html: '', url }
  }
}

/**
 * Extract readable text from a SIBOM HTML boletin page.
 * Splits content by sections (ordenanzas, decretos, resoluciones).
 */
export function extractBoletinText(html: string): string {
  const $ = cheerio.load(html)
  $('script, style, noscript, iframe, nav, footer, header').remove()

  const mainContent = $('main, article, .content, #content, body').first()
  const text = mainContent
    .text()
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return text
}

// ---------------------------------------------------------------------------
// Main connector
// ---------------------------------------------------------------------------

export async function ingestSIBOM(
  municipalityName: string,
  municipalityId: string
): Promise<IngestResult> {
  const result = emptyResult('sibom', municipalityId)
  const startTime = Date.now()

  console.log(`  [sibom] Attempting to access SIBOM for ${municipalityName}...`)

  // Try to access the main SIBOM page
  const mainPage = await fetchPage(SIBOM_BASE_URL)

  if (!mainPage.ok) {
    const warning = `SIBOM not accessible (HTTP ${mainPage.status}). URL: ${SIBOM_BASE_URL}`
    console.warn(`  [sibom] ${warning}`)
    result.errors.push(warning)
    result.duration = Date.now() - startTime
    return result
  }

  await sleep(RATE_LIMIT_MS)

  // Try to find municipality-specific links on the SIBOM page
  const $ = cheerio.load(mainPage.html)
  const links: string[] = []

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? ''
    const text = $(el).text().toLowerCase()
    const nameLC = municipalityName.toLowerCase()

    if (text.includes(nameLC) || href.toLowerCase().includes(municipalityId)) {
      try {
        const fullUrl = new URL(href, SIBOM_BASE_URL).href
        links.push(fullUrl)
      } catch {
        // invalid URL, skip
      }
    }
  })

  if (links.length === 0) {
    // Try a search/filter URL pattern (common in SIBOM-like systems)
    const searchUrls = [
      `${SIBOM_BASE_URL}/municipio/${municipalityId}`,
      `${SIBOM_BASE_URL}/buscar?municipio=${encodeURIComponent(municipalityName)}`,
      `${SIBOM_BASE_URL}/?municipio=${encodeURIComponent(municipalityName)}`,
    ]

    for (const url of searchUrls) {
      const probe = await fetchPage(url)
      await sleep(RATE_LIMIT_MS)

      if (probe.ok && probe.html.length > 500) {
        const text = extractBoletinText(probe.html)
        if (text.length > 100) {
          result.pagesProcessed++
          console.log(`  [sibom] Found content at ${url} (${text.length} chars)`)
        }
      }
    }
  } else {
    console.log(`  [sibom] Found ${links.length} links for ${municipalityName}`)

    for (const link of links.slice(0, 20)) {
      const page = await fetchPage(link)
      await sleep(RATE_LIMIT_MS)

      if (!page.ok) continue

      // Skip PDFs — log their existence
      if (link.toLowerCase().endsWith('.pdf')) {
        console.log(`  [sibom] Found PDF boletin (skipping, Sprint 4): ${link}`)
        result.chunksSkipped++
        continue
      }

      const text = extractBoletinText(page.html)
      if (text.length > 100) {
        result.pagesProcessed++
      }
    }
  }

  result.duration = Date.now() - startTime
  console.log(
    `  [sibom] ${municipalityName}: ${result.pagesProcessed} boletines processed, ` +
      `${result.chunksSkipped} skipped (PDF), ${result.errors.length} errors`
  )
  return result
}
