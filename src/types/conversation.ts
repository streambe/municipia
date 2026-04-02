export interface Conversation {
  id: string
  municipality_id: string
  session_id: string | null
  started_at: string
  last_message_at: string
  message_count: number
  metadata: Record<string, unknown>
  feedback_rating: number | null
}

export interface Message {
  id: string
  conversation_id: string
  municipality_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  sources: MessageSource[]
  token_count: number | null
  latency_ms: number | null
  model: string | null
  created_at: string
}

export interface MessageSource {
  document_id: string
  chunk_id: string
  score: number
}
