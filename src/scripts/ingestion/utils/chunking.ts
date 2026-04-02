/**
 * Document chunking utility for the MunicipIA ingestion pipeline.
 *
 * Strategy: split by paragraphs first, then by sentences if a paragraph
 * exceeds the target size.  Overlap is applied between consecutive chunks.
 */

export interface ChunkMetadata {
  source_url: string
  source_title: string
  municipality_id: string
  chunk_index: number
  total_chunks: number
}

export interface Chunk {
  content: string
  metadata: ChunkMetadata
}

const DEFAULT_CHUNK_SIZE = 1000 // characters
const DEFAULT_OVERLAP = 200
const MIN_CHUNK_SIZE = 100

/**
 * Split a document into overlapping chunks with metadata.
 */
export function chunkDocument(
  text: string,
  metadata: Partial<ChunkMetadata>,
  options?: { chunkSize?: number; overlap?: number; minChunkSize?: number }
): Chunk[] {
  const chunkSize = options?.chunkSize ?? DEFAULT_CHUNK_SIZE
  const overlap = options?.overlap ?? DEFAULT_OVERLAP
  const minSize = options?.minChunkSize ?? MIN_CHUNK_SIZE

  if (!text || text.trim().length === 0) return []

  // Step 1 — split into raw segments that respect paragraph boundaries
  const rawSegments = splitIntoSegments(text, chunkSize)

  // Step 2 — apply overlap and merge tiny trailing segments
  const chunks = applyOverlapAndMerge(rawSegments, overlap, minSize)

  // Step 3 — attach metadata
  return chunks.map((content, i) => ({
    content,
    metadata: {
      source_url: metadata.source_url ?? '',
      source_title: metadata.source_title ?? '',
      municipality_id: metadata.municipality_id ?? '',
      chunk_index: i,
      total_chunks: chunks.length,
    },
  }))
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Split text into segments of roughly `maxLen` characters, breaking at
 * paragraph boundaries first, then sentence boundaries.
 */
export function splitIntoSegments(text: string, maxLen: number): string[] {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
  const segments: string[] = []
  let current = ''

  for (const para of paragraphs) {
    const trimmed = para.trim()

    if (current.length + trimmed.length + 1 <= maxLen) {
      current = current ? `${current}\n\n${trimmed}` : trimmed
    } else {
      // Flush current if non-empty
      if (current) segments.push(current)

      if (trimmed.length <= maxLen) {
        current = trimmed
      } else {
        // Paragraph too long — split by sentences
        const sentenceChunks = splitBySentences(trimmed, maxLen)
        // All but the last become their own segments; last becomes the new current
        for (let i = 0; i < sentenceChunks.length - 1; i++) {
          segments.push(sentenceChunks[i])
        }
        current = sentenceChunks[sentenceChunks.length - 1]
      }
    }
  }

  if (current) segments.push(current)
  return segments
}

/**
 * Split a long paragraph by sentences, accumulating into segments of `maxLen`.
 */
function splitBySentences(text: string, maxLen: number): string[] {
  // Match sentences ending with . ! ? followed by space or end-of-string
  const sentences = text.match(/[^.!?]+[.!?]+[\s]*/g) || [text]
  const segments: string[] = []
  let current = ''

  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (!trimmed) continue

    if (current.length + trimmed.length + 1 <= maxLen) {
      current = current ? `${current} ${trimmed}` : trimmed
    } else {
      if (current) segments.push(current)
      // If a single sentence exceeds maxLen, just accept it as-is
      current = trimmed
    }
  }

  if (current) segments.push(current)
  return segments
}

/**
 * Apply sliding-window overlap between consecutive segments and merge any
 * trailing chunk that is shorter than `minSize` into the previous one.
 */
function applyOverlapAndMerge(
  segments: string[],
  overlap: number,
  minSize: number
): string[] {
  if (segments.length === 0) return []
  if (segments.length === 1) return segments

  const result: string[] = [segments[0]]

  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1]
    const overlapText = prev.slice(Math.max(0, prev.length - overlap))
    const merged = `${overlapText}\n\n${segments[i]}`
    result.push(merged)
  }

  // Merge tiny trailing chunks into the previous one
  const final: string[] = []
  for (const chunk of result) {
    if (final.length > 0 && chunk.trim().length < minSize) {
      final[final.length - 1] = `${final[final.length - 1]}\n\n${chunk}`
    } else {
      final.push(chunk)
    }
  }

  return final
}
