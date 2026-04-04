import { anthropic } from '@/lib/ai/anthropic'
import { streamText } from 'ai'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import { retrieveContext } from '@/services/rag'
import { createServerClient } from '@/lib/supabase/server'
import { addMessage } from '@/services/conversations'
import { redactPII } from '@/lib/pii'
import { rateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit'
import { checkPromptInjection } from '@/lib/guardrails'
import { getObsidianMemory } from '@/services/obsidian-memory'
import type { Municipality } from '@/types/municipality'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  // Rate limiting: 20 requests/minute per IP
  const ip = getClientIP(req)
  const rl = rateLimit(ip, { interval: 60_000, maxRequests: 20 })
  if (!rl.success) {
    return rateLimitResponse()
  }

  try {
    const body = await req.json()
    const { messages, municipalityId, conversationId } = body

    // Validate input
    if (!municipalityId || typeof municipalityId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'municipalityId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'messages array is required and must not be empty' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const lastMessage = messages[messages.length - 1]
    if (
      !lastMessage?.content ||
      typeof lastMessage.content !== 'string' ||
      lastMessage.content.length > 2000
    ) {
      return new Response(
        JSON.stringify({
          error: 'Last message content must be a non-empty string of max 2000 chars',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Guardrails: check for prompt injection before calling LLM
    const guardrailCheck = checkPromptInjection(lastMessage.content)
    if (!guardrailCheck.safe) {
      return new Response(
        guardrailCheck.reason || 'No puedo responder a ese tipo de solicitud.',
        { headers: { 'Content-Type': 'text/plain' } }
      )
    }

    // Fetch municipality by slug (frontend sends slug, not UUID)
    const supabase = createServerClient()
    const { data: municipality, error: munError } = await supabase
      .from('municipalities')
      .select('*')
      .eq('slug', municipalityId)
      .eq('enabled', true)
      .single()

    if (munError || !municipality) {
      return new Response(
        JSON.stringify({ error: 'Municipality not found or disabled' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // RAG: find relevant chunks (use UUID from DB, not slug)
    const { context, chunks } = await retrieveContext(
      municipality.id,
      lastMessage.content,
      5,
      0.7
    )

    // Load Obsidian long-term memory (non-blocking, graceful degradation)
    let obsidianMemory = ''
    try {
      const memory = getObsidianMemory(municipality.slug)
      obsidianMemory = memory.combined
    } catch (err) {
      console.warn('Obsidian memory load failed (continuing without it):', err)
    }

    // Build system prompt with full template from architecture doc
    const systemPrompt = buildSystemPrompt(
      municipality as Municipality,
      context,
      obsidianMemory
    )

    // Stream response using Vercel AI SDK
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPrompt,
      messages,
      onFinish: async ({ text }) => {
        // Persist messages after streaming completes (non-blocking)
        if (conversationId) {
          try {
            const sources = chunks.map((c) => ({
              document_id: c.document_id,
              chunk_id: c.id,
              score: 0,
            }))
            // Redact PII from user message before persisting
            await addMessage(
              conversationId,
              municipality.id,
              'user',
              redactPII(lastMessage.content)
            )
            await addMessage(
              conversationId,
              municipality.id,
              'assistant',
              text,
              sources
            )
          } catch (err) {
            console.error('Failed to persist messages:', err)
          }

          // Save conversation summary to Obsidian (async, non-blocking)
          if (messages.length >= 2) {
            try {
              const { saveConversation } = await import(
                '../../../../scripts/obsidian/save-conversation'
              )
              saveConversation(conversationId).catch((e: unknown) =>
                console.warn('Obsidian save-conversation failed:', e)
              )
            } catch (e) {
              console.warn('Obsidian save-conversation import failed:', e)
            }
          }
        }
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
