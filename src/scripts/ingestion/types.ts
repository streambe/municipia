/**
 * Shared types for the MunicipIA ingestion pipeline.
 */

export interface IngestResult {
  source: string
  municipalityId: string
  pagesProcessed: number
  chunksCreated: number
  chunksUpdated: number
  chunksSkipped: number
  errors: string[]
  duration: number // ms
}

export interface MunicipalityConfig {
  id: string
  name: string
  baseUrl: string
}

export function emptyResult(source: string, municipalityId: string): IngestResult {
  return {
    source,
    municipalityId,
    pagesProcessed: 0,
    chunksCreated: 0,
    chunksUpdated: 0,
    chunksSkipped: 0,
    errors: [],
    duration: 0,
  }
}

export function mergeResults(results: IngestResult[]): IngestResult {
  if (results.length === 0) return emptyResult('merged', 'unknown')
  return {
    source: results.map((r) => r.source).join('+'),
    municipalityId: results[0].municipalityId,
    pagesProcessed: results.reduce((s, r) => s + r.pagesProcessed, 0),
    chunksCreated: results.reduce((s, r) => s + r.chunksCreated, 0),
    chunksUpdated: results.reduce((s, r) => s + r.chunksUpdated, 0),
    chunksSkipped: results.reduce((s, r) => s + r.chunksSkipped, 0),
    errors: results.flatMap((r) => r.errors),
    duration: results.reduce((s, r) => s + r.duration, 0),
  }
}
