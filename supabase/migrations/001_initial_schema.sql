-- MunicipIA - Initial Database Schema
-- Supabase (PostgreSQL) with pgvector

-- 7.1 Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 7.2 Municipalities
CREATE TABLE municipalities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  province TEXT NOT NULL DEFAULT 'Buenos Aires',
  phone TEXT,
  website TEXT,
  email TEXT,
  address TEXT,
  agent_name TEXT NOT NULL DEFAULT 'Asistente Municipal',
  agent_welcome_message TEXT,
  system_prompt_override TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
  enabled BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_municipalities_slug ON municipalities (slug);
CREATE INDEX idx_municipalities_enabled ON municipalities (enabled) WHERE enabled = true;

-- 7.3 Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  municipality_id UUID NOT NULL REFERENCES municipalities(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_url TEXT,
  title TEXT,
  content_hash TEXT NOT NULL,
  content_length INTEGER,
  mime_type TEXT,
  language TEXT DEFAULT 'es',
  metadata JSONB DEFAULT '{}',
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(municipality_id, content_hash)
);

CREATE INDEX idx_documents_municipality ON documents (municipality_id);
CREATE INDEX idx_documents_source_type ON documents (municipality_id, source_type);
CREATE INDEX idx_documents_hash ON documents (content_hash);

-- 7.4 Document Chunks
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  municipality_id UUID NOT NULL REFERENCES municipalities(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(512) NOT NULL,
  token_count INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chunks_embedding ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_chunks_municipality ON document_chunks (municipality_id);
CREATE INDEX idx_chunks_document ON document_chunks (document_id);

-- 7.5 Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  municipality_id UUID NOT NULL REFERENCES municipalities(id) ON DELETE CASCADE,
  session_id TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  message_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  feedback_rating INTEGER
    CHECK (feedback_rating IS NULL OR (feedback_rating >= 1 AND feedback_rating <= 5))
);

CREATE INDEX idx_conversations_municipality ON conversations (municipality_id);
CREATE INDEX idx_conversations_last_message ON conversations (municipality_id, last_message_at DESC);

-- 7.6 Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  municipality_id UUID NOT NULL REFERENCES municipalities(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]',
  token_count INTEGER,
  latency_ms INTEGER,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at);
CREATE INDEX idx_messages_municipality ON messages (municipality_id, created_at DESC);

-- 7.7 Ingestion Sources
CREATE TABLE ingestion_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  municipality_id UUID NOT NULL REFERENCES municipalities(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  schedule TEXT DEFAULT 'daily',
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ingestion_sources_municipality ON ingestion_sources (municipality_id);
CREATE INDEX idx_ingestion_sources_enabled ON ingestion_sources (enabled) WHERE enabled = true;

-- 7.8 Ingestion Logs
CREATE TABLE ingestion_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID REFERENCES ingestion_sources(id) ON DELETE SET NULL,
  municipality_id UUID NOT NULL REFERENCES municipalities(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'partial', 'error')),
  documents_found INTEGER DEFAULT 0,
  documents_new INTEGER DEFAULT 0,
  documents_updated INTEGER DEFAULT 0,
  chunks_created INTEGER DEFAULT 0,
  error_message TEXT,
  error_details JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
);

CREATE INDEX idx_ingestion_logs_municipality ON ingestion_logs (municipality_id, started_at DESC);
CREATE INDEX idx_ingestion_logs_status ON ingestion_logs (status) WHERE status = 'error';

-- 7.9 RLS Policies
ALTER TABLE municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "municipalities_public_read" ON municipalities
  FOR SELECT USING (enabled = true);

CREATE POLICY "chunks_read_by_municipality" ON document_chunks
  FOR SELECT USING (true);

CREATE POLICY "conversations_by_municipality" ON conversations
  FOR SELECT USING (true);

CREATE POLICY "conversations_insert" ON conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "messages_by_municipality" ON messages
  FOR SELECT USING (true);

CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "documents_service_only" ON documents
  FOR ALL USING (false);

CREATE POLICY "ingestion_sources_service_only" ON ingestion_sources
  FOR ALL USING (false);

CREATE POLICY "ingestion_logs_service_only" ON ingestion_logs
  FOR ALL USING (false);

-- 7.10 Vector search function
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(512),
  filter_municipality_id UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE dc.municipality_id = filter_municipality_id
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
