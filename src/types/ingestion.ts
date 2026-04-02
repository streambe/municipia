export interface IngestionSource {
  id: string
  municipality_id: string
  source_type: 'web' | 'pdf' | 'ckan' | 'sibom' | 'social'
  name: string
  url: string
  config: Record<string, unknown>
  schedule: 'daily' | 'weekly' | 'manual'
  enabled: boolean
  last_run_at: string | null
  last_run_status: 'success' | 'partial' | 'error' | null
  created_at: string
  updated_at: string
}

export interface IngestionLog {
  id: string
  source_id: string | null
  municipality_id: string
  status: 'running' | 'success' | 'partial' | 'error'
  documents_found: number
  documents_new: number
  documents_updated: number
  chunks_created: number
  error_message: string | null
  error_details: Record<string, unknown> | null
  started_at: string
  completed_at: string | null
  duration_ms: number | null
}

export interface DocumentChunk {
  id: string
  document_id: string
  municipality_id: string
  chunk_index: number
  content: string
  token_count: number | null
  metadata: Record<string, unknown>
  created_at: string
}
