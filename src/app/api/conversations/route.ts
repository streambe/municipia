import { NextResponse } from 'next/server'
import { createConversation, getConversation, getMessages } from '@/services/conversations'
import { rateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(req: Request) {
  const ip = getClientIP(req)
  const rl = rateLimit(ip, { interval: 60_000, maxRequests: 30 })
  if (!rl.success) return rateLimitResponse()

  try {
    const body = await req.json()
    const { municipalityId } = body

    if (!municipalityId || typeof municipalityId !== 'string') {
      return NextResponse.json(
        { error: 'municipalityId is required' },
        { status: 400 }
      )
    }

    const conversation = await createConversation(municipalityId)

    return NextResponse.json(
      {
        id: conversation.id,
        municipalityId: conversation.municipality_id,
        startedAt: conversation.started_at,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create conversation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  const ip = getClientIP(req)
  const rl = rateLimit(ip, { interval: 60_000, maxRequests: 30 })
  if (!rl.success) return rateLimitResponse()

  try {
    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('id')

    if (!conversationId) {
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400 }
      )
    }

    const conversation = await getConversation(conversationId)
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const messages = await getMessages(conversationId)

    return NextResponse.json({
      id: conversation.id,
      municipalityId: conversation.municipality_id,
      startedAt: conversation.started_at,
      lastMessageAt: conversation.last_message_at,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.created_at,
      })),
    })
  } catch (error) {
    console.error('Get conversation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
