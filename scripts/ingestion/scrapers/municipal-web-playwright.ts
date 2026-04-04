/**
 * Playwright-based municipal web scraper for JavaScript-rendered (SPA) sites.
 * Falls back to this when the Cheerio scraper gets 0 results.
 */

import { chromium, type Browser, type Page } from 'playwright'
import { createHash } from 'crypto'

interface ScrapedPage {
  url: string
  title: string
  content: string
  contentHash: string
  scrapedAt: string
}

interface PlaywrightScraperConfig {
  baseUrl: string
  municipalityName: string
  maxPages: number
  rateLimit: number // ms between requests
  maxDepth: number
}

const USER_AGENT = 'MunicipIA/1.0 (https://municipia.org.ar; contacto@streambe.com)'

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

function isSameDomain(url: string, baseUrl: string): boolean {
  try {
    const base = new URL(baseUrl)
    const target = new URL(url)
    return target.hostname === base.hostname
  } catch {
    return false
  }
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url)
    u.hash = ''
    u.search = ''
    return u.toString().replace(/\/$/, '')
  } catch {
    return url
  }
}

async function extractContent(page: Page): Promise<{ title: string; content: string }> {
  return page.evaluate(() => {
    // Remove non-content elements
    const selectorsToRemove = ['script', 'style', 'nav', 'header', 'footer', 'iframe', 'noscript', '.cookie-banner', '.popup', '[role="navigation"]']
    selectorsToRemove.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => el.remove())
    })

    const title = document.title || ''
    const body = document.body
    if (!body) return { title, content: '' }

    // Get visible text content
    const content = body.innerText
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\t+/g, ' ')
      .replace(/ {3,}/g, ' ')
      .trim()

    return { title, content }
  })
}

async function extractLinks(page: Page, baseUrl: string): Promise<string[]> {
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href]'))
      .map(a => (a as HTMLAnchorElement).href)
      .filter(href => href.startsWith('http'))
  })

  return [...new Set(links.filter(l => isSameDomain(l, baseUrl)).map(normalizeUrl))]
}

export async function scrapeWithPlaywright(config: PlaywrightScraperConfig): Promise<ScrapedPage[]> {
  const { baseUrl, municipalityName, maxPages, rateLimit, maxDepth } = config
  console.log(`  [playwright] Starting headless browser for ${municipalityName}...`)

  let browser: Browser | null = null
  const visited = new Set<string>()
  const results: ScrapedPage[] = []
  const queue: Array<{ url: string; depth: number }> = [{ url: normalizeUrl(baseUrl), depth: 0 }]

  try {
    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1280, height: 720 },
    })

    while (queue.length > 0 && results.length < maxPages) {
      const { url, depth } = queue.shift()!
      const normalizedUrl = normalizeUrl(url)

      if (visited.has(normalizedUrl)) continue
      if (depth > maxDepth) continue
      visited.add(normalizedUrl)

      try {
        const page = await context.newPage()

        // Navigate with timeout
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {
          // Fallback to domcontentloaded if networkidle times out
          return page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 })
        })

        // Wait a bit for JS to render
        await page.waitForTimeout(1000)

        const { title, content } = await extractContent(page)

        if (content.length > 50) {
          const contentHash = hashContent(content)
          results.push({
            url: normalizedUrl,
            title,
            content,
            contentHash,
            scrapedAt: new Date().toISOString(),
          })

          if (results.length % 10 === 0) {
            console.log(`  [playwright] ${municipalityName}: ${results.length} pages scraped...`)
          }
        }

        // Extract links for BFS
        if (depth < maxDepth) {
          const links = await extractLinks(page, baseUrl)
          for (const link of links) {
            if (!visited.has(normalizeUrl(link))) {
              queue.push({ url: link, depth: depth + 1 })
            }
          }
        }

        await page.close()
        await sleep(rateLimit)
      } catch (err) {
        console.log(`  [playwright] Error on ${url}: ${(err as Error).message?.substring(0, 80)}`)
      }
    }

    console.log(`  [playwright] ${municipalityName}: Done. ${results.length} pages scraped.`)
  } catch (err) {
    console.error(`  [playwright] Fatal error for ${municipalityName}:`, (err as Error).message)
  } finally {
    if (browser) await browser.close()
  }

  return results
}
