import { retrieveContext } from '@/services/rag'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import { getMunicipalityById } from '@/services/municipalities'
import {
  createConversation,
  addMessage,
  getMessages,
} from '@/services/conversations'

export interface ChatResult {
  conversationId: string
  systemPrompt: string
  context: string
  history: Array<{ role: string; content: string }>
}

/**
 * Orchestrates the chat flow:
 * 1. Resolve municipality
 * 2. Ensure conversation exists
 * 3. RAG retrieval
 * 4. Build system prompt
 * 5. Get recent history
 *
 * The actual LLM call and streaming happens in the API route.
 * This service prepares all the context needed for the LLM call.
 */
export async function prepareChatContext(
  municipalityId: string,
  conversationId: string | null,
  message: string
): Promise<ChatResult> {
  // 1. Get municipality
  const municipality = await getMunicipalityById(municipalityId)
  if (!municipality) {
    throw new Error('Municipality not found or disabled')
  }

  // 2. Ensure conversation exists
  let activeConversationId = conversationId
  if (!activeConversationId) {
    const conversation = await createConversation(municipalityId)
    activeConversationId = conversation.id
  }

  // 3. RAG: retrieve relevant chunks
  const { context } = await retrieveContext(municipalityId, message, 5, 0.7)

  // 4. Build system prompt
  const systemPrompt = buildSystemPrompt(municipality, context)

  // 5. Get recent conversation history (last 6 messages)
  const recentMessages = conversationId
    ? await getMessages(conversationId, 6)
    : []

  const history = recentMessages.map((m) => ({
    role: m.role,
    content: m.content,
  }))

  return {
    conversationId: activeConversationId,
    systemPrompt,
    context,
    history,
  }
}

/**
 * Persists a user message and assistant response after chat completion.
 */
export async function persistChatMessages(
  conversationId: string,
  municipalityId: string,
  userMessage: string,
  assistantMessage: string,
  sources: Array<{ document_id: string; chunk_id: string; score: number }> = []
): Promise<void> {
  await addMessage(conversationId, municipalityId, 'user', userMessage)
  await addMessage(
    conversationId,
    municipalityId,
    'assistant',
    assistantMessage,
    sources
  )
}
