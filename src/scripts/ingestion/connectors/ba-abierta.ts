/**
 * Buenos Aires Abierta connector — Honorable Tribunal de Cuentas de PBA.
 *
 * Attempts to scrape public financial data (budget, income, expenses, debt)
 * for a given municipality from the BA Abierta portal.
 * If the portal is not accessible, returns an empty result with warning.
 */

import * as cheerio from 'cheerio'
import { emptyResult, type IngestResult } from '../types'

const USER_AGENT = 'MunicipIA/1.0 (https://municipia.org.ar)'
const REQUEST_TIMEOUT = 15_000
const RATE_LIMIT_MS = 1000
const BA_ABIERTA_BASE_URL = 'https://baabierta.htcpba.gob.ar'

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
    console.warn(`  [ba-abierta] Error fetching ${url}: ${msg}`)
    return { ok: false, status: 0, html: '', url }
  }
}

/**
 * Extract financial data text from an HTML page.
 */
export function extractFinancialText(html: string): string {
  const $ = cheerio.load(html)
  $('script, style, noscript, iframe, nav, footer, header').remove()

  const mainContent = $('main, article, .content, #content, .data-container, table, body').first()
  const text = mainContent
    .text()
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return text
}

/**
 * Extract table data from HTML into readable text.
 */
export function extractTables(html: string): string[] {
  const $ = cheerio.load(html)
  const tables: string[] = []

  $('table').each((_, table) => {
    const rows: string[] = []
    $(table)
      .find('tr')
      .each((_, tr) => {
        const cells: string[] = []
        $(tr)
          .find('th, td')
          .each((_, cell) => {
            cells.push($(cell).text().trim())
          })
        if (cells.length > 0) {
          rows.push(cells.join(' | '))
        }
      })
    if (rows.length > 0) {
      tables.push(rows.join('\n'))
    }
  })

  return tables
}

// ---------------------------------------------------------------------------
// Main connector
// ---------------------------------------------------------------------------

export async function ingestBAAbierta(
  municipalityName: string,
  municipalityId: string
): Promise<IngestResult> {
  const result = emptyResult('ba_abierta', municipalityId)
  const startTime = Date.now()

  console.log(`  [ba-abierta] Attempting to access BA Abierta for ${municipalityName}...`)

  // Try to access the main page
  const mainPage = await fetchPage(BA_ABIERTA_BASE_URL)

  if (!mainPage.ok) {
    const warning = `BA Abierta not accessible (HTTP ${mainPage.status}). URL: ${BA_ABIERTA_BASE_URL}`
    console.warn(`  [ba-abierta] ${warning}`)
    result.errors.push(warning)
    result.duration = Date.now() - startTime
    return result
  }

  await sleep(RATE_LIMIT_MS)

  // Try common URL patterns for municipality financial data
  const searchUrls = [
    `${BA_ABIERTA_BASE_URL}/municipio/${municipalityId}`,
    `${BA_ABIERTA_BASE_URL}/municipios/${municipalityId}`,
    `${BA_ABIERTA_BASE_URL}/buscar?q=${encodeURIComponent(municipalityName)}`,
    `${BA_ABIERTA_BASE_URL}/cuentas/${municipalityId}`,
    `${BA_ABIERTA_BASE_URL}/?municipio=${encodeURIComponent(municipalityName)}`,
  ]

  // Also look for municipality links on the main page
  const $ = cheerio.load(mainPage.html)
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? ''
    const text = $(el).text().toLowerCase()
    const nameLC = municipalityName.toLowerCase()

    if (text.includes(nameLC) || href.toLowerCase().includes(municipalityId)) {
      try {
        const fullUrl = new URL(href, BA_ABIERTA_BASE_URL).href
        if (!searchUrls.includes(fullUrl)) {
          searchUrls.push(fullUrl)
        }
      } catch {
        // invalid URL, skip
      }
    }
  })

  for (const url of searchUrls) {
    const page = await fetchPage(url)
    await sleep(RATE_LIMIT_MS)

    if (!page.ok) continue

    // Try extracting tables (financial data is usually tabular)
    const tables = extractTables(page.html)
    if (tables.length > 0) {
      result.pagesProcessed++
      console.log(`  [ba-abierta] Found ${tables.length} tables at ${url}`)
      continue
    }

    // Fallback: extract general text
    const text = extractFinancialText(page.html)
    if (text.length > 200) {
      result.pagesProcessed++
      console.log(`  [ba-abierta] Found content at ${url} (${text.length} chars)`)
    }
  }

  result.duration = Date.now() - startTime
  console.log(
    `  [ba-abierta] ${municipalityName}: ${result.pagesProcessed} pages processed, ` +
      `${result.errors.length} errors`
  )
  return result
}
