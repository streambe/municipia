/**
 * Local News connector — Scrapes local news media for each municipality.
 *
 * Uses Playwright to scrape news websites. Lives in scripts/ (outside src/)
 * to avoid Next.js build issues.
 *
 * Rate limiting: 2 seconds between pages.
 */

import { chromium, type Browser, type Page } from 'playwright'
import { createHash } from 'crypto'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NewsSource {
  name: string
  url: string
  searchPath?: string
}

export interface NewsPageContent {
  url: string
  title: string
  content: string
  contentHash: string
  scrapedAt: string
  sourceName: string
}

export interface LocalNewsIngestResult {
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
// Configuration — News sources per municipality
// ---------------------------------------------------------------------------

export const LOCAL_NEWS: Record<string, NewsSource[]> = {
  'vicente-lopez': [
    { name: 'Que Pasa Web', url: 'https://quepasaweb.com.ar', searchPath: '/?s=vicente+lopez' },
  ],
  'san-isidro': [
    { name: 'Que Pasa Web', url: 'https://quepasaweb.com.ar', searchPath: '/?s=san+isidro' },
  ],
  'moron': [
    { name: 'La Ciudad', url: 'https://laciudadweb.com.ar', searchPath: '/?s=moron' },
  ],
  'la-plata': [
    { name: '0221', url: 'https://www.0221.com.ar' },
    { name: 'El Día', url: 'https://www.eldia.com' },
  ],
  'lanus': [
    { name: 'Perspectiva Sur', url: 'https://www.perspectivasur.com', searchPath: '/?s=lanus' },
  ],
  'tigre': [
    { name: 'Que Pasa Web', url: 'https://quepasaweb.com.ar', searchPath: '/?s=tigre' },
  ],
  'general-rodriguez': [
    { name: 'Semanario Actualidad', url: 'https://semanarioactualidad.com.ar' },
  ],
  'ameghino': [],
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USER_AGENT = 'MunicipIA/1.0 (https://municipia.org.ar; contacto@streambe.com)'
const PAGE_DELAY_MS = 2000
const PAGE_TIMEOUT_MS = 15000
const MAX_NEWS_PER_SOURCE = 20

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

/**
 * Extract article links from a news page.
 */
async function extractArticleLinks(page: Page, baseUrl: string): Promise<string[]> {
  const links = await page.evaluate((base: string) => {
    const anchors = Array.from(document.querySelectorAll('a[href]'))
    return anchors
      .map((a) => (a as HTMLAnchorElement).href)
      .filter((href) => {
        if (!href.startsWith('http')) return false
        // Filter to same domain or contains base
        try {
          const u = new URL(href)
          const b = new URL(base)
          return u.hostname === b.hostname
        } catch {
          return false
        }
      })
  }, baseUrl)

  // Deduplicate and limit
  const unique = [...new Set(links)]
  // Heuristic: articles usually have longer paths
  const articleLike = unique.filter((l) => {
    try {
      const path = new URL(l).pathname
      return path.length > 10 && path !== '/'
    } catch {
      return false
    }
  })

  return articleLike.slice(0, MAX_NEWS_PER_SOURCE)
}

/**
 * Scrape article content from a page.
 */
async function scrapeArticle(page: Page, url: string): Promise<{ title: string; content: string } | null> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT_MS })
    await page.waitForTimeout(1000)

    const result = await page.evaluate(() => {
      const selectorsToRemove = [
        'script', 'style', 'nav', 'header', 'footer', 'iframe',
        'noscript', '.cookie-banner', '.popup', '[role="navigation"]',
        '.advertisement', '.ad-container', '.sidebar', '.comments',
      ]
      selectorsToRemove.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => el.remove())
      })

      // Try article-specific selectors first
      const articleEl = document.querySelector('article') ||
        document.querySelector('[role="main"]') ||
        document.querySelector('.post-content') ||
        document.querySelector('.entry-content') ||
        document.querySelector('.article-body')

      const title = document.querySelector('h1')?.textContent?.trim() ||
        document.title || ''

      const source = articleEl || document.body
      if (!source) return { title, content: '' }

      const content = (source as HTMLElement).innerText
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\t+/g, ' ')
        .replace(/ {3,}/g, ' ')
        .trim()

      return { title, content }
    })

    if (!result.content || result.content.length < 100) {
      return null
    }

    return result
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Main connector
// ---------------------------------------------------------------------------

export async function ingestLocalNews(
  municipalityName: string,
  municipalityId: string
): Promise<{ result: LocalNewsIngestResult; pages: NewsPageContent[] }> {
  const result: LocalNewsIngestResult = {
    source: 'local_news',
    municipalityId,
    pagesProcessed: 0,
    chunksCreated: 0,
    chunksUpdated: 0,
    chunksSkipped: 0,
    errors: [],
    duration: 0,
  }
  const allPages: NewsPageContent[] = []
  const startTime = Date.now()

  const sources = LOCAL_NEWS[municipalityId]
  if (!sources || sources.length === 0) {
    console.log(`  [local-news] No news sources configured for ${municipalityId}`)
    result.duration = Date.now() - startTime
    return { result, pages: allPages }
  }

  console.log(`  [local-news] Scraping ${sources.length} news sources for ${municipalityName}...`)

  let browser: Browser | null = null

  try {
    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1280, height: 720 },
    })

    for (const source of sources) {
      console.log(`  [local-news] Scraping ${source.name} (${source.url})...`)

      try {
        const listPage = await context.newPage()
        const listUrl = source.searchPath
          ? `${source.url}${source.searchPath}`
          : source.url

        await listPage.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT_MS })
        await listPage.waitForTimeout(1500)

        const articleLinks = await extractArticleLinks(listPage, source.url)
        await listPage.close()

        console.log(`  [local-news] Found ${articleLinks.length} articles from ${source.name}`)

        for (const link of articleLinks) {
          const articlePage = await context.newPage()
          const article = await scrapeArticle(articlePage, link)
          await articlePage.close()

          if (article) {
            allPages.push({
              url: link,
              title: article.title,
              content: article.content,
              contentHash: hashContent(article.content),
              scrapedAt: new Date().toISOString(),
              sourceName: source.name,
            })
            result.pagesProcessed++
          }

          await sleep(PAGE_DELAY_MS)
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`  [local-news] Error with ${source.name}: ${msg}`)
        result.errors.push(`${source.name}: ${msg}`)
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`  [local-news] Fatal error for ${municipalityName}: ${msg}`)
    result.errors.push(msg)
  } finally {
    if (browser) await browser.close()
  }

  result.duration = Date.now() - startTime
  console.log(`  [local-news] ${municipalityName}: ${result.pagesProcessed} articles scraped in ${result.duration}ms`)

  return { result, pages: allPages }
}
