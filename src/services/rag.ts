import { createServerClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/ai/embeddings'
import type { DocumentChunk } from '@/types/ingestion'

export interface RAGResult {
  chunks: DocumentChunk[]
  context: string
}

const EMPTY_RESULT: RAGResult = { chunks: [], context: '' }

/**
 * Retrieve relevant document chunks for a query using vector similarity search.
 * Gracefully degrades: if any step fails (embedding, DB, missing env vars),
 * returns an empty result so the chat can continue without context.
 */
export async function retrieveContext(
  municipalityId: string,
  query: string,
  matchCount: number = 5,
  matchThreshold: number = 0.7
): Promise<RAGResult> {
  // Guard: if Supabase is not configured, skip RAG
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.warn('RAG skipped: Supabase environment variables not configured')
    return EMPTY_RESULT
  }

  // Guard: if Voyage API key is missing, skip embedding
  if (!process.env.VOYAGE_API_KEY) {
    console.warn('RAG skipped: VOYAGE_API_KEY not configured')
    return EMPTY_RESULT
  }

  try {
    const embedding = await generateEmbedding(query)

    const supabase = createServerClient()
    const { data, error } = await supabase.rpc('match_chunks', {
      query_embedding: embedding,
      filter_municipality_id: municipalityId,
      match_threshold: matchThreshold,
      match_count: matchCount,
    })

    if (error) {
      console.error('RAG query error:', error)
      return EMPTY_RESULT
    }

    const chunks = (data ?? []) as DocumentChunk[]

    if (chunks.length > 0) {
      console.log(
        `RAG: found ${chunks.length} chunks for municipality=${municipalityId} query="${query.slice(0, 80)}"`
      )
    }

    const context = chunks.map((c) => c.content).join('\n\n---\n\n')

    return { chunks, context }
  } catch (error) {
    console.error('RAG pipeline error:', error)
    return EMPTY_RESULT
  }
}
