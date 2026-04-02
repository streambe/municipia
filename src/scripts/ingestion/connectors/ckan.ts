/**
 * CKAN connector for MunicipIA ingestion pipeline.
 *
 * Queries CKAN open data portals (PBA + Datos Argentina) for datasets
 * related to a given municipality, downloads CSV/JSON resources,
 * and returns chunked text for embedding.
 */

import { emptyResult, type IngestResult } from '../types'

const USER_AGENT = 'MunicipIA/1.0 (https://municipia.org.ar)'
const REQUEST_TIMEOUT = 15_000
const RATE_LIMIT_MS = 500
const MAX_RESOURCE_SIZE = 5 * 1024 * 1024 // 5 MB

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface CKANConfig {
  portalUrl: string
  portalName: string
  municipalityKeywords: string[]
}

export const CKAN_PORTALS: CKANConfig[] = [
  {
    portalUrl: 'https://catalogo.datos.gba.gob.ar',
    portalName: 'Datos Abiertos PBA',
    municipalityKeywords: [], // filled per municipality
  },
  {
    portalUrl: 'https://datos.gob.ar',
    portalName: 'Datos Argentina',
    municipalityKeywords: [],
  },
]

export const MUNICIPALITY_KEYWORDS: Record<string, string[]> = {
  'vicente-lopez': ['Vicente López', 'vicente lopez'],
  'san-isidro': ['San Isidro', 'san isidro'],
  'moron': ['Morón', 'moron'],
  'la-plata': ['La Plata', 'la plata'],
  'lanus': ['Lanús', 'lanus'],
  'general-rodriguez': ['General Rodríguez', 'general rodriguez'],
  'ameghino': ['Ameghino', 'ameghino', 'Florentino Ameghino'],
  'tigre': ['Tigre', 'tigre'],
}

// ---------------------------------------------------------------------------
// CKAN API types
// ---------------------------------------------------------------------------

interface CKANPackageSearchResponse {
  success: boolean
  result: {
    count: number
    results: CKANDataset[]
  }
}

interface CKANDataset {
  id: string
  name: string
  title: string
  notes?: string
  license_title?: string
  update_frequency?: string
  resources: CKANResource[]
}

interface CKANResource {
  id: string
  name: string
  format: string
  url: string
  size?: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    })
    if (!res.ok) {
      console.warn(`  [ckan] HTTP ${res.status} for ${url}`)
      return null
    }
    return (await res.json()) as T
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`  [ckan] Error fetching ${url}: ${msg}`)
    return null
  }
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    })
    if (!res.ok) return null
    // Check content-length to avoid huge files
    const contentLength = res.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > MAX_RESOURCE_SIZE) {
      console.warn(`  [ckan] Resource too large (${contentLength} bytes), skipping: ${url}`)
      return null
    }
    return await res.text()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`  [ckan] Error downloading resource ${url}: ${msg}`)
    return null
  }
}

/**
 * Parse CSV text into a readable text block (rows as lines).
 * Simple parser — handles basic CSVs without a dependency.
 */
export function csvToText(csv: string, maxRows: number = 500): string {
  const lines = csv.split('\n').filter((l) => l.trim().length > 0)
  if (lines.length === 0) return ''

  const header = lines[0]
  const dataLines = lines.slice(1, maxRows + 1)

  const rows = dataLines.map((line) => {
    // Simple CSV split (doesn't handle quoted commas perfectly, but good enough)
    return line
  })

  return `Columnas: ${header}\n\n${rows.join('\n')}`
}

/**
 * Parse JSON array/object into readable text.
 */
export function jsonToText(raw: string, maxItems: number = 200): string {
  try {
    const parsed = JSON.parse(raw)
    const items = Array.isArray(parsed) ? parsed.slice(0, maxItems) : [parsed]
    return items
      .map((item) =>
        typeof item === 'object' && item !== null
          ? Object.entries(item)
              .map(([k, v]) => `${k}: ${v}`)
              .join(' | ')
          : String(item)
      )
      .join('\n')
  } catch {
    return ''
  }
}

// ---------------------------------------------------------------------------
// Main connector
// ---------------------------------------------------------------------------

export async function ingestCKAN(
  config: CKANConfig,
  municipalityId: string
): Promise<IngestResult> {
  const result = emptyResult(`ckan_${config.portalName.toLowerCase().replace(/\s+/g, '_')}`, municipalityId)
  const startTime = Date.now()

  const keywords = config.municipalityKeywords
  if (keywords.length === 0) {
    result.errors.push(`No keywords configured for municipality ${municipalityId}`)
    result.duration = Date.now() - startTime
    return result
  }

  console.log(`  [ckan] Querying ${config.portalName} for: ${keywords.join(', ')}`)

  // Search for datasets matching any keyword
  const allDatasets: CKANDataset[] = []

  for (const keyword of keywords) {
    const encodedQ = encodeURIComponent(keyword)
    const url = `${config.portalUrl}/api/3/action/package_search?q=${encodedQ}&rows=100`

    const response = await fetchJSON<CKANPackageSearchResponse>(url)
    await sleep(RATE_LIMIT_MS)

    if (!response || !response.success) {
      result.errors.push(`Failed to search ${config.portalName} for "${keyword}"`)
      continue
    }

    // Deduplicate by dataset id
    for (const ds of response.result.results) {
      if (!allDatasets.find((d) => d.id === ds.id)) {
        allDatasets.push(ds)
      }
    }
  }

  console.log(`  [ckan] Found ${allDatasets.length} datasets on ${config.portalName}`)

  // Process each dataset
  for (const dataset of allDatasets) {
    const supportedResources = dataset.resources.filter((r) => {
      const fmt = r.format?.toLowerCase() ?? ''
      return ['csv', 'json', 'geojson'].includes(fmt)
    })

    if (supportedResources.length === 0) {
      // Log XLS/other formats we skip
      const otherFormats = dataset.resources.map((r) => r.format).filter(Boolean)
      if (otherFormats.length > 0) {
        console.log(`  [ckan] Skipping dataset "${dataset.title}" — formats: ${otherFormats.join(', ')}`)
      }
      result.chunksSkipped++
      continue
    }

    for (const resource of supportedResources) {
      const raw = await fetchText(resource.url)
      await sleep(RATE_LIMIT_MS)

      if (!raw || raw.trim().length === 0) {
        result.errors.push(`Empty resource: ${resource.url}`)
        continue
      }

      const format = resource.format?.toLowerCase() ?? ''
      let text = ''

      if (format === 'csv') {
        text = csvToText(raw)
      } else if (format === 'json' || format === 'geojson') {
        text = jsonToText(raw)
      }

      if (text.length < 50) {
        result.chunksSkipped++
        continue
      }

      // Prepend dataset metadata
      const header = [
        `Dataset: ${dataset.title}`,
        dataset.notes ? `Descripcion: ${dataset.notes.slice(0, 300)}` : '',
        dataset.license_title ? `Licencia: ${dataset.license_title}` : '',
        dataset.update_frequency ? `Frecuencia: ${dataset.update_frequency}` : '',
        `Recurso: ${resource.name || resource.id} (${format.toUpperCase()})`,
        `Fuente: ${config.portalName}`,
        '',
      ]
        .filter(Boolean)
        .join('\n')

      result.pagesProcessed++
      // Chunks will be created by the orchestrator; we count the "page" here
      // The text content is what gets chunked downstream
      result.chunksCreated++ // placeholder — actual chunking happens in orchestrator
    }
  }

  result.duration = Date.now() - startTime
  console.log(
    `  [ckan] ${config.portalName}: ${result.pagesProcessed} resources processed, ` +
      `${result.errors.length} errors`
  )
  return result
}

/**
 * Run CKAN ingestion for a municipality across all configured portals.
 */
export async function ingestAllCKAN(
  municipalityId: string,
  municipalityName: string
): Promise<IngestResult[]> {
  const keywords = MUNICIPALITY_KEYWORDS[municipalityId] ?? [municipalityName]
  const results: IngestResult[] = []

  for (const portal of CKAN_PORTALS) {
    const config: CKANConfig = {
      ...portal,
      municipalityKeywords: keywords,
    }
    const result = await ingestCKAN(config, municipalityId)
    results.push(result)
  }

  return results
}
