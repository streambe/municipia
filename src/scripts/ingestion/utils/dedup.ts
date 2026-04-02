/**
 * Document deduplication utilities.
 *
 * Uses content_hash (SHA-256) to determine whether a scraped page has changed
 * since the last ingestion, avoiding unnecessary re-embedding.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface DocumentRecord {
  url: string
  title: string
  contentHash: string
  contentLength: number
  municipalityId: string
  sourceType?: string
  metadata?: Record<string, unknown>
}

/**
 * Returns `true` when the document is new or its content has changed.
 */
export async function isDocumentChanged(
  supabase: SupabaseClient,
  url: string,
  contentHash: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('documents')
    .select('id, content_hash')
    .eq('source_url', url)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.warn(`[dedup] Error checking document ${url}:`, error.message)
    // On error, assume changed so we don't silently skip
    return true
  }

  if (!data) return true // new document
  return data.content_hash !== contentHash
}

/**
 * Insert or update a document row. Returns the document id.
 *
 * When the document already exists (matched by source_url + municipality_id),
 * it updates content_hash, title, and content_length. The caller is
 * responsible for deleting old chunks and inserting new ones.
 */
export async function upsertDocument(
  supabase: SupabaseClient,
  doc: DocumentRecord
): Promise<string> {
  // Try to find existing document first
  const { data: existing } = await supabase
    .from('documents')
    .select('id')
    .eq('source_url', doc.url)
    .eq('municipality_id', doc.municipalityId)
    .limit(1)
    .maybeSingle()

  if (existing) {
    // Update
    const { error } = await supabase
      .from('documents')
      .update({
        title: doc.title,
        content_hash: doc.contentHash,
        content_length: doc.contentLength,
        metadata: doc.metadata ?? {},
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (error) throw new Error(`[dedup] Failed to update document: ${error.message}`)

    // Delete old chunks so they get re-created
    await supabase.from('document_chunks').delete().eq('document_id', existing.id)

    return existing.id
  }

  // Insert new
  const { data, error } = await supabase
    .from('documents')
    .insert({
      municipality_id: doc.municipalityId,
      source_type: doc.sourceType ?? 'web',
      source_url: doc.url,
      title: doc.title,
      content_hash: doc.contentHash,
      content_length: doc.contentLength,
      metadata: doc.metadata ?? {},
    })
    .select('id')
    .single()

  if (error) throw new Error(`[dedup] Failed to insert document: ${error.message}`)
  return data.id
}

/**
 * Insert chunks with their embeddings for a given document.
 */
export async function upsertChunks(
  supabase: SupabaseClient,
  documentId: string,
  municipalityId: string,
  chunks: { content: string; metadata: Record<string, unknown> }[],
  embeddings: number[][]
): Promise<number> {
  const rows = chunks.map((chunk, i) => ({
    document_id: documentId,
    municipality_id: municipalityId,
    chunk_index: i,
    content: chunk.content,
    embedding: JSON.stringify(embeddings[i]),
    token_count: Math.ceil(chunk.content.length / 4), // rough estimate
    metadata: chunk.metadata,
  }))

  // Insert in batches of 50
  const BATCH_SIZE = 50
  let inserted = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('document_chunks').insert(batch)
    if (error) {
      console.error(`[dedup] Failed to insert chunks batch ${i}:`, error.message)
      throw error
    }
    inserted += batch.length
  }

  return inserted
}
