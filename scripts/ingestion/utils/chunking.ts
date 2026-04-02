/**
 * Text chunking utilities for RAG ingestion
 * Splits documents into overlapping chunks suitable for embedding
 */

export interface Chunk {
  content: string
  index: number
  tokenCount: number
  metadata: Record<string, unknown>
}

export function chunkText(
  text: string,
  options: {
    maxTokens?: number
    overlapTokens?: number
  } = {}
): Chunk[] {
  const { maxTokens = 500, overlapTokens = 50 } = options

  // TODO: Implement proper token-aware chunking
  // TODO: Split on paragraph boundaries when possible
  // TODO: Add overlap between chunks for context continuity

  // Simple placeholder: split by paragraphs
  const paragraphs = text.split(/\n\n+/)
  return paragraphs.map((content, index) => ({
    content: content.trim(),
    index,
    tokenCount: Math.ceil(content.length / 4), // rough estimate
    metadata: {},
  }))
}
