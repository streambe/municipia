import { describe, it, expect } from 'vitest'
import {
  extractContent,
  contentHash,
  isAllowedByRobots,
} from './municipal-web'

describe('extractContent', () => {
  it('extracts text from simple HTML', () => {
    const html = '<html><body><h1>Titulo</h1><p>Contenido de la pagina.</p></body></html>'
    const result = extractContent(html)
    expect(result.title).toBe('Titulo')
    expect(result.content).toContain('Contenido de la pagina')
  })

  it('removes script and style tags', () => {
    const html = `
      <html><body>
        <script>alert("x")</script>
        <style>.foo { color: red }</style>
        <p>Texto visible</p>
      </body></html>
    `
    const result = extractContent(html)
    expect(result.content).not.toContain('alert')
    expect(result.content).not.toContain('color')
    expect(result.content).toContain('Texto visible')
  })

  it('removes nav and footer elements', () => {
    const html = `
      <html><body>
        <nav><a href="/">Home</a></nav>
        <main><p>Main content here</p></main>
        <footer>Copyright 2024</footer>
      </body></html>
    `
    const result = extractContent(html)
    expect(result.content).toContain('Main content')
    expect(result.content).not.toContain('Copyright')
  })

  it('prefers main/article content when available', () => {
    const html = `
      <html><body>
        <div class="sidebar">Sidebar stuff</div>
        <main><p>Important content</p></main>
      </body></html>
    `
    const result = extractContent(html)
    expect(result.content).toContain('Important content')
  })

  it('falls back to title tag if no h1', () => {
    const html = '<html><head><title>Page Title</title></head><body><p>Text</p></body></html>'
    const result = extractContent(html)
    expect(result.title).toBe('Page Title')
  })

  it('returns empty content for empty HTML', () => {
    const result = extractContent('<html><body></body></html>')
    expect(result.content).toBe('')
  })
})

describe('contentHash', () => {
  it('produces a 64-char hex string (SHA-256)', () => {
    const hash = contentHash('Hello world')
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]+$/)
  })

  it('produces different hashes for different content', () => {
    expect(contentHash('aaa')).not.toBe(contentHash('bbb'))
  })

  it('produces the same hash for the same content', () => {
    expect(contentHash('test')).toBe(contentHash('test'))
  })
})

describe('isAllowedByRobots', () => {
  const robotsTxt = `
User-agent: *
Disallow: /admin/
Disallow: /private/
Allow: /

User-agent: Googlebot
Disallow: /secret/
  `.trim()

  it('allows non-disallowed paths', () => {
    expect(isAllowedByRobots(robotsTxt, 'https://example.com/tramites')).toBe(true)
  })

  it('blocks disallowed paths', () => {
    expect(isAllowedByRobots(robotsTxt, 'https://example.com/admin/users')).toBe(false)
    expect(isAllowedByRobots(robotsTxt, 'https://example.com/private/docs')).toBe(false)
  })

  it('allows everything when robots.txt is empty', () => {
    expect(isAllowedByRobots('', 'https://example.com/anything')).toBe(true)
  })

  it('allows root path', () => {
    expect(isAllowedByRobots(robotsTxt, 'https://example.com/')).toBe(true)
  })
})
