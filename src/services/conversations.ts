import { createServerClient } from '@/lib/supabase/server'
import type { Conversation, Message } from '@/types/conversation'

export async function createConversation(
  municipalityId: string,
  sessionId?: string
): Promise<Conversation> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      municipality_id: municipalityId,
      session_id: sessionId ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data as Conversation
}

export async function getConversation(
  conversationId: string
): Promise<Conversation | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()

  if (error) return null
  return data as Conversation
}

export async function addMessage(
  conversationId: string,
  municipalityId: string,
  role: 'user' | 'assistant',
  content: string,
  sources?: Array<{ document_id: string; chunk_id: string; score: number }>
) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      municipality_id: municipalityId,
      role,
      content,
      ...(sources ? { sources } : {}),
    })
    .select()
    .single()

  if (error) throw error

  // Update conversation last_message_at
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)

  return data as Message
}

export async function getMessages(
  conversationId: string,
  limit: number = 6
): Promise<Message[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return ((data as Message[]) ?? []).reverse()
}
