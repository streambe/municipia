/**
 * PBAC connector — Provincia de Buenos Aires Compras.
 *
 * Attempts to fetch public procurement data from the PBAC portal.
 * The portal at https://pbac.cgp.gba.gov.ar/ uses dynamic content
 * that is not easily scrapeable without a browser, so this connector
 * acts as a robust stub that logs the attempt and returns empty results.
 *
 * Future improvements (Sprint 4+):
 * - Use Playwright for dynamic page rendering
 * - Parse licitaciones, adjudicaciones by municipality
 * - Chunk by procurement process
 */

import { emptyResult, type IngestResult } from '../types'

const PBAC_BASE_URL = 'https://pbac.cgp.gba.gov.ar'
const USER_AGENT = 'MunicipIA/1.0 (https://municipia.org.ar)'
const REQUEST_TIMEOUT = 15_000

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface FetchResult {
  ok: boolean
  status: number
  text: string
}

async function probePBAC(): Promise<FetchResult> {
  try {
    const res = await fetch(PBAC_BASE_URL, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      redirect: 'follow',
    })
    const text = res.ok ? await res.text() : ''
    return { ok: res.ok, status: res.status, text }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`  [pbac] Error probing PBAC: ${msg}`)
    return { ok: false, status: 0, text: '' }
  }
}

// ---------------------------------------------------------------------------
// Main connector
// ---------------------------------------------------------------------------

export async function ingestPBAC(
  municipalityName: string,
  municipalityId: string
): Promise<IngestResult> {
  const result = emptyResult('pbac', municipalityId)
  const startTime = Date.now()

  console.log(`  [pbac] Attempting PBAC ingestion for ${municipalityName}...`)

  // Probe the portal to check availability
  const probe = await probePBAC()

  if (!probe.ok) {
    const warning = `PBAC portal not accessible (HTTP ${probe.status}). URL: ${PBAC_BASE_URL}. ` +
      `Dynamic portal requires browser-based scraping (planned for Sprint 4+).`
    console.warn(`  [pbac] ${warning}`)
    result.errors.push(warning)
    result.duration = Date.now() - startTime
    return result
  }

  // Portal is accessible but uses dynamic JS rendering.
  // We cannot extract meaningful procurement data without a headless browser.
  console.log(
    `  [pbac] PBAC portal is accessible but requires dynamic rendering. ` +
    `Skipping extraction for ${municipalityName} (planned for Sprint 4+).`
  )

  result.duration = Date.now() - startTime
  return result
}
