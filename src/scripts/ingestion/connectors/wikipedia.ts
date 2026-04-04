/**
 * Wikipedia connector — Fetches municipality articles from Spanish Wikipedia.
 *
 * Uses the Wikipedia REST API (no scraping needed).
 * Extracts clean text from HTML using cheerio.
 */

import * as cheerio from 'cheerio'
import { emptyResult, type IngestResult } from '../types'

const WIKI_SUMMARY_API = 'https://es.wikipedia.org/api/rest_v1/page/summary/'
const WIKI_HTML_API = 'https://es.wikipedia.org/api/rest_v1/page/html/'
const USER_AGENT = 'MunicipIA/1.0 (https://municipia.org.ar; contacto@streambe.com)'
const REQUEST_TIMEOUT = 15_000

// ---------------------------------------------------------------------------
// Wikipedia article titles per municipality
// ---------------------------------------------------------------------------

export const WIKI_TITLES: Record<string, string[]> = {
  'vicente-lopez': ['Partido de Vicente López', 'Vicente López (ciudad)'],
  'san-isidro': ['Partido de San Isidro', 'San Isidro (Buenos Aires)'],
  'moron': ['Partido de Morón', 'Morón (Buenos Aires)'],
  'la-plata': ['La Plata', 'Partido de La Plata'],
  'lanus': ['Partido de Lanús', 'Lanús'],
  'general-rodriguez': ['Partido de General Rodríguez', 'General Rodríguez'],
  'ameghino': ['Partido de Florentino Ameghino', 'Florentino Ameghino (Buenos Aires)'],
  'tigre': ['Partido de Tigre', 'Tigre (Buenos Aires)'],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Fetch the HTML of a Wikipedia article and extract clean text.
 */
export async function fetchWikiArticle(title: string): Promise<{ title: string; content: string } | null> {
  const encoded = encodeURIComponent(title)

  // First check if article exists via summary endpoint
  try {
    const summaryRes = await fetch(`${WIKI_SUMMARY_API}${encoded}`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    })
    if (!summaryRes.ok) {
      console.log(`  [wikipedia] Article not found: ${title} (${summaryRes.status})`)
      return null
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`  [wikipedia] Summary check failed for ${title}: ${msg}`)
    return null
  }

  // Fetch full HTML
  try {
    const htmlRes = await fetch(`${WIKI_HTML_API}${encoded}`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    })
    if (!htmlRes.ok) {
      console.warn(`  [wikipedia] HTML fetch failed for ${title}: ${htmlRes.status}`)
      return null
    }

    const html = await htmlRes.text()
    const $ = cheerio.load(html)

    // Remove non-content elements
    $('style, script, sup.reference, .mw-editsection, .navbox, .infobox, .sidebar, .mw-empty-elt, .noprint').remove()

    const text = $('body')
      .text()
      .replace(/\[editar\]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    if (text.length < 100) {
      console.log(`  [wikipedia] Article too short: ${title} (${text.length} chars)`)
      return null
    }

    return { title, content: text }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`  [wikipedia] HTML fetch error for ${title}: ${msg}`)
    return null
  }
}

// ---------------------------------------------------------------------------
// Main connector
// ---------------------------------------------------------------------------

export async function ingestWikipedia(
  municipalityName: string,
  municipalityId: string
): Promise<IngestResult> {
  const result = emptyResult('wikipedia', municipalityId)
  const startTime = Date.now()

  const titles = WIKI_TITLES[municipalityId]
  if (!titles || titles.length === 0) {
    console.log(`  [wikipedia] No Wikipedia titles configured for ${municipalityId}`)
    result.duration = Date.now() - startTime
    return result
  }

  console.log(`  [wikipedia] Fetching ${titles.length} articles for ${municipalityName}...`)

  for (const title of titles) {
    try {
      const article = await fetchWikiArticle(title)
      if (article) {
        result.pagesProcessed++
        result.chunksCreated++ // Actual chunking happens in orchestrator
        console.log(`  [wikipedia] Got article: ${title} (${article.content.length} chars)`)
      }
      // Rate limit between requests
      await sleep(1000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  [wikipedia] Error fetching ${title}: ${msg}`)
      result.errors.push(`${title}: ${msg}`)
    }
  }

  result.duration = Date.now() - startTime
  return result
}
