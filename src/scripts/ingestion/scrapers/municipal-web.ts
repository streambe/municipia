/**
 * Generic municipal website scraper.
 *
 * BFS crawl from a base URL, extracting clean text with Cheerio.
 * Respects robots.txt, rate limits, depth and page count limits.
 */

import * as cheerio from 'cheerio'
import { createHash } from 'crypto'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScraperConfig {
  municipalityId: string
  municipalityName: string
  baseUrl: string
  maxPages: number
  maxDepth: number
  rateLimit: number // ms between requests
}

export interface ScrapedPage {
  url: string
  title: string
  content: string
  rawHtml: string
  contentHash: string
  scrapedAt: string
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: Partial<ScraperConfig> = {
  maxPages: 200,
  maxDepth: 3,
  rateLimit: 1000,
}

const USER_AGENT = 'MunicipIA/1.0 (https://municipia.org.ar; contacto@streambe.com)'
const REQUEST_TIMEOUT = 10_000

// ---------------------------------------------------------------------------
// robots.txt helper
// ---------------------------------------------------------------------------

export async function fetchRobotsTxt(baseUrl: string): Promise<string> {
  try {
    const url = new URL('/robots.txt', baseUrl).href
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    })
    if (!res.ok) return ''
    return await res.text()
  } catch {
    return ''
  }
}

export function isAllowedByRobots(
  robotsTxt: string,
  url: string,
  userAgent: string = '*'
): boolean {
  if (!robotsTxt) return true

  const lines = robotsTxt.split('\n')
  let inRelevantBlock = false
  const disallowed: string[] = []

  for (const raw of lines) {
    const line = raw.trim()
    if (line.toLowerCase().startsWith('user-agent:')) {
      const agent = line.slice('user-agent:'.length).trim()
      inRelevantBlock = agent === '*' || agent.toLowerCase() === userAgent.toLowerCase()
    } else if (inRelevantBlock && line.toLowerCase().startsWith('disallow:')) {
      const path = line.slice('disallow:'.length).trim()
      if (path) disallowed.push(path)
    }
  }

  const urlPath = new URL(url).pathname
  return !disallowed.some((d) => urlPath.startsWith(d))
}

// ---------------------------------------------------------------------------
// Content extraction
// ---------------------------------------------------------------------------

/**
 * Extract clean text from HTML, removing noise (scripts, styles, nav, footer).
 */
export function extractContent(html: string): { title: string; content: string } {
  const $ = cheerio.load(html)

  // Remove noise elements
  $('script, style, noscript, iframe, svg, nav, footer, header, aside').remove()
  $('[role="navigation"], [role="banner"], [role="contentinfo"]').remove()
  $('.nav, .navbar, .footer, .sidebar, .menu, .breadcrumb, .cookie-banner').remove()

  // Try to find the main content area
  const mainSelectors = ['main', 'article', '[role="main"]', '#content', '.content']
  let contentEl: ReturnType<typeof $> | null = null

  for (const sel of mainSelectors) {
    const el = $(sel)
    if (el.length > 0) {
      contentEl = el.first()
      break
    }
  }

  const title =
    $('h1').first().text().trim() ||
    $('title').first().text().trim() ||
    ''

  const textSource = contentEl ?? $('body')
  const text = textSource
    .text()
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return { title, content: text }
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

function normalizeUrl(href: string, baseUrl: string): string | null {
  try {
    const url = new URL(href, baseUrl)
    // Strip hash and trailing slash
    url.hash = ''
    const path = url.pathname.replace(/\/+$/, '') || '/'
    url.pathname = path
    return url.href
  } catch {
    return null
  }
}

function isSameDomain(url: string, baseUrl: string): boolean {
  try {
    const a = new URL(url)
    const b = new URL(baseUrl)
    return a.hostname === b.hostname
  } catch {
    return false
  }
}

function isScrapableUrl(url: string): boolean {
  const ext = url.split('.').pop()?.toLowerCase() ?? ''
  const skip = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'mp4', 'mp3', 'zip', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'css', 'js']
  return !skip.includes(ext)
}

// ---------------------------------------------------------------------------
// Hash
// ---------------------------------------------------------------------------

export function contentHash(text: string): string {
  return createHash('sha256').update(text, 'utf-8').digest('hex')
}

// ---------------------------------------------------------------------------
// Sleep
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// ---------------------------------------------------------------------------
// Main scraper
// ---------------------------------------------------------------------------

export async function scrapeMunicipality(
  config: Partial<ScraperConfig> & Pick<ScraperConfig, 'municipalityId' | 'municipalityName' | 'baseUrl'>
): Promise<ScrapedPage[]> {
  const cfg: ScraperConfig = { ...DEFAULT_CONFIG, ...config } as ScraperConfig
  const pages: ScrapedPage[] = []
  const visited = new Set<string>()

  // Fetch and parse robots.txt
  console.log(`  [scraper] Fetching robots.txt for ${cfg.baseUrl}`)
  const robotsTxt = await fetchRobotsTxt(cfg.baseUrl)

  // BFS queue: [url, depth]
  const queue: [string, number][] = [[cfg.baseUrl, 0]]
  visited.add(cfg.baseUrl)

  while (queue.length > 0 && pages.length < cfg.maxPages) {
    const [url, depth] = queue.shift()!

    // Check robots.txt
    if (!isAllowedByRobots(robotsTxt, url)) {
      console.log(`  [scraper] Blocked by robots.txt: ${url}`)
      continue
    }

    // Fetch page
    let html: string
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        redirect: 'follow',
      })
      if (!res.ok) {
        console.warn(`  [scraper] HTTP ${res.status} for ${url}`)
        continue
      }
      const contentType = res.headers.get('content-type') ?? ''
      if (!contentType.includes('text/html')) {
        continue
      }
      html = await res.text()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`  [scraper] Error fetching ${url}: ${msg}`)
      continue
    }

    // Extract content
    const { title, content } = extractContent(html)

    if (content.length < 50) {
      // Too little content, skip but still extract links
    } else {
      pages.push({
        url,
        title,
        content,
        rawHtml: html,
        contentHash: contentHash(content),
        scrapedAt: new Date().toISOString(),
      })
    }

    // Extract links for BFS (only if within depth limit)
    if (depth < cfg.maxDepth) {
      const $ = cheerio.load(html)
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href')
        if (!href) return

        const normalized = normalizeUrl(href, url)
        if (!normalized) return
        if (visited.has(normalized)) return
        if (!isSameDomain(normalized, cfg.baseUrl)) return
        if (!isScrapableUrl(normalized)) return

        visited.add(normalized)
        queue.push([normalized, depth + 1])
      })
    }

    // Rate limit
    if (queue.length > 0) {
      await sleep(cfg.rateLimit)
    }
  }

  return pages
}
