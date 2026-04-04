/**
 * Google Search connector — Scrapes Google search results via Playwright
 * to discover additional pages relevant to each municipality.
 *
 * IMPORTANT: This connector uses Playwright (headless browser) and lives
 * in scripts/ (outside src/) to avoid Next.js build issues.
 *
 * Rate limiting: 5 seconds between Google searches to avoid CAPTCHAs.
 */

import { chromium, type Browser, type Page } from 'playwright'
import { createHash } from 'crypto'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

export interface GoogleSearchPageContent {
  url: string
  title: string
  content: string
  contentHash: string
  scrapedAt: string
}

export interface GoogleSearchIngestResult {
  source: string
  municipalityId: string
  pagesProcessed: number
  chunksCreated: number
  chunksUpdated: number
  chunksSkipped: number
  errors: string[]
  duration: number
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const USER_AGENT = 'MunicipIA/1.0 (https://municipia.org.ar; contacto@streambe.com)'
const GOOGLE_DELAY_MS = 5000
const PAGE_SCRAPE_DELAY_MS = 2000
const PAGE_TIMEOUT_MS = 15000

/**
 * Search queries to run per municipality.
 * {municipality} is replaced with the municipality name.
 */
export const SEARCH_QUERIES = [
  '{municipality} municipio buenos aires trámites servicios',
  '{municipality} municipio noticias',
  '{municipality} municipio obras públicas',
  '{municipality} municipio presupuesto',
  '{municipality} municipio horarios atención',
  '{municipality} barrios localidades',
  '{municipality} transporte colectivos',
  '{municipality} hospitales centros salud',
  '{municipality} escuelas educación',
  '{municipality} cultura deportes',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

// ---------------------------------------------------------------------------
// Google Search scraping
// ---------------------------------------------------------------------------

/**
 * Scrape Google search results for a given query using Playwright.
 */
export async function searchGoogle(
  page: Page,
  query: string,
  maxResults: number = 20
): Promise<SearchResult[]> {
  const encoded = encodeURIComponent(query)
  const url = `https://www.google.com/search?q=${encoded}&num=${maxResults}&hl=es`

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT_MS })
    await page.waitForTimeout(1500)

    const results = await page.evaluate(() => {
      const items: { title: string; url: string; snippet: string }[] = []
      // Standard Google result selectors
      const resultEls = document.querySelectorAll('div.g, div[data-sokoban-container]')

      resultEls.forEach((el) => {
        const linkEl = el.querySelector('a[href^="http"]') as HTMLAnchorElement | null
        const titleEl = el.querySelector('h3')
        const snippetEl = el.querySelector('[data-sncf], .VwiC3b, .s3v9rd')

        if (linkEl && titleEl) {
          items.push({
            title: titleEl.textContent?.trim() || '',
            url: linkEl.href,
            snippet: snippetEl?.textContent?.trim() || '',
          })
        }
      })

      return items
    })

    return results.slice(0, maxResults)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`  [google-search] Search failed for "${query}": ${msg}`)
    return []
  }
}

/**
 * Scrape the content of a page using Playwright.
 */
export async function scrapePageContent(
  page: Page,
  url: string
): Promise<GoogleSearchPageContent | null> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT_MS })
    await page.waitForTimeout(1000)

    const result = await page.evaluate(() => {
      // Remove non-content elements
      const selectorsToRemove = [
        'script', 'style', 'nav', 'header', 'footer', 'iframe',
        'noscript', '.cookie-banner', '.popup', '[role="navigation"]',
        '.advertisement', '.ad-container',
      ]
      selectorsToRemove.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => el.remove())
      })

      const title = document.title || ''
      const body = document.body
      if (!body) return { title, content: '' }

      const content = body.innerText
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\t+/g, ' ')
        .replace(/ {3,}/g, ' ')
        .trim()

      return { title, content }
    })

    if (!result.content || result.content.length < 100) {
      return null
    }

    return {
      url,
      title: result.title,
      content: result.content,
      contentHash: hashContent(result.content),
      scrapedAt: new Date().toISOString(),
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`  [google-search] Failed to scrape ${url}: ${msg}`)
    return null
  }
}

// ---------------------------------------------------------------------------
// Main connector
// ---------------------------------------------------------------------------

export async function ingestGoogleSearch(
  municipalityName: string,
  municipalityId: string
): Promise<{ result: GoogleSearchIngestResult; pages: GoogleSearchPageContent[] }> {
  const result: GoogleSearchIngestResult = {
    source: 'google_search',
    municipalityId,
    pagesProcessed: 0,
    chunksCreated: 0,
    chunksUpdated: 0,
    chunksSkipped: 0,
    errors: [],
    duration: 0,
  }
  const allPages: GoogleSearchPageContent[] = []
  const startTime = Date.now()
  const seenUrls = new Set<string>()

  console.log(`  [google-search] Starting Google search ingestion for ${municipalityName}...`)

  let browser: Browser | null = null

  try {
    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1280, height: 720 },
    })

    const searchPage = await context.newPage()

    for (const queryTemplate of SEARCH_QUERIES) {
      const query = queryTemplate.replace('{municipality}', municipalityName)
      console.log(`  [google-search] Searching: "${query}"`)

      const searchResults = await searchGoogle(searchPage, query)
      console.log(`  [google-search] Got ${searchResults.length} results`)

      // Scrape each result page
      for (const sr of searchResults) {
        if (seenUrls.has(sr.url)) continue
        seenUrls.add(sr.url)

        // Skip Google-internal and unwanted URLs
        if (sr.url.includes('google.com') || sr.url.includes('youtube.com')) continue

        const contentPage = await context.newPage()
        const pageContent = await scrapePageContent(contentPage, sr.url)
        await contentPage.close()

        if (pageContent) {
          allPages.push(pageContent)
          result.pagesProcessed++
        }

        await sleep(PAGE_SCRAPE_DELAY_MS)
      }

      // Delay between Google searches to avoid CAPTCHAs
      await sleep(GOOGLE_DELAY_MS)
    }

    await searchPage.close()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`  [google-search] Fatal error for ${municipalityName}: ${msg}`)
    result.errors.push(msg)
  } finally {
    if (browser) await browser.close()
  }

  result.duration = Date.now() - startTime
  console.log(`  [google-search] ${municipalityName}: ${result.pagesProcessed} pages scraped in ${result.duration}ms`)

  return { result, pages: allPages }
}
