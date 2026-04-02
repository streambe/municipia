import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { rateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit'

function validateAdminAuth(req: Request): boolean {
  const authHeader = req.headers.get('authorization')
  const adminKey = process.env.ADMIN_API_KEY
  if (!adminKey) return false
  return authHeader === `Bearer ${adminKey}`
}

export async function GET(req: Request) {
  const ip = getClientIP(req)
  const rl = rateLimit(ip, { interval: 60_000, maxRequests: 10 })
  if (!rl.success) return rateLimitResponse()

  if (!validateAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServerClient()
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString()

    const [
      municipalitiesRes,
      documentsRes,
      chunksRes,
      conversationsRes,
      totalMessagesRes,
      conversations24hRes,
      messages24hRes,
      lastIngestionRes,
    ] = await Promise.all([
      supabase
        .from('municipalities')
        .select('id, name', { count: 'exact' })
        .eq('enabled', true),
      supabase
        .from('documents')
        .select('municipality_id', { count: 'exact' }),
      supabase
        .from('document_chunks')
        .select('municipality_id', { count: 'exact' }),
      supabase.from('conversations').select('id', { count: 'exact' }),
      supabase.from('messages').select('id, municipality_id', { count: 'exact' }),
      supabase
        .from('conversations')
        .select('id, municipality_id', { count: 'exact' })
        .gte('started_at', twentyFourHoursAgo),
      supabase
        .from('messages')
        .select('id, municipality_id, latency_ms', { count: 'exact' })
        .gte('created_at', twentyFourHoursAgo),
      supabase
        .from('ingestion_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1),
    ])

    // Average latency from last 24h assistant messages
    const messages24h = messages24hRes.data ?? []
    const latencies = messages24h
      .map((m) => m.latency_ms)
      .filter((l): l is number => l !== null && l > 0)
    const avgLatencyMs =
      latencies.length > 0
        ? Math.round(
            latencies.reduce((a, b) => a + b, 0) / latencies.length
          )
        : 0

    // Per-municipality breakdown
    const municipalities = municipalitiesRes.data ?? []
    const documents = documentsRes.data ?? []
    const chunks = chunksRes.data ?? []
    const conversations24h = conversations24hRes.data ?? []

    const allMessages = totalMessagesRes.data ?? []

    const byMunicipality = municipalities.map((mun) => ({
      id: mun.id,
      name: mun.name,
      documents: documents.filter((d) => d.municipality_id === mun.id).length,
      chunks: chunks.filter((c) => c.municipality_id === mun.id).length,
      conversations24h: conversations24h.filter(
        (c) => c.municipality_id === mun.id
      ).length,
      messages: allMessages.filter((m) => m.municipality_id === mun.id).length,
    }))

    const lastIngestionData = lastIngestionRes.data?.[0] ?? null
    const lastIngestion = lastIngestionData
      ? { date: lastIngestionData.created_at, status: lastIngestionData.status ?? 'unknown' }
      : null

    return NextResponse.json({
      totalMunicipalities: municipalitiesRes.count ?? 0,
      totalDocuments: documentsRes.count ?? 0,
      totalChunks: chunksRes.count ?? 0,
      totalConversations: conversationsRes.count ?? 0,
      totalMessages: totalMessagesRes.count ?? 0,
      lastIngestion,
      last24h: {
        conversations: conversations24hRes.count ?? 0,
        messages: messages24hRes.count ?? 0,
        avgLatencyMs,
      },
      byMunicipality,
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
