import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { rateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit'

function validateAdminAuth(req: Request): boolean {
  const authHeader = req.headers.get('authorization')
  const adminKey = process.env.ADMIN_API_KEY
  if (!adminKey) return false
  return authHeader === `Bearer ${adminKey}`
}

export async function POST(req: Request) {
  const ip = getClientIP(req)
  const rl = rateLimit(ip, { interval: 60_000, maxRequests: 10 })
  if (!rl.success) return rateLimitResponse()

  if (!validateAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { municipalityId, sourceId } = body

    if (!municipalityId || typeof municipalityId !== 'string') {
      return NextResponse.json(
        { error: 'municipalityId is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Verify municipality exists
    const { data: mun, error: munError } = await supabase
      .from('municipalities')
      .select('id, slug')
      .eq('id', municipalityId)
      .single()

    if (munError || !mun) {
      return NextResponse.json(
        { error: 'Municipality not found' },
        { status: 404 }
      )
    }

    // Create ingestion log entry with status "running"
    const { data: log, error: logError } = await supabase
      .from('ingestion_logs')
      .insert({
        municipality_id: municipalityId,
        source_id: sourceId ?? null,
        status: 'running',
      })
      .select('id, status')
      .single()

    if (logError) {
      throw logError
    }

    return NextResponse.json(
      {
        logId: log.id,
        status: 'running',
        message: `Ingestion started for ${mun.slug}`,
      },
      { status: 202 }
    )
  } catch (error) {
    console.error('Ingest trigger error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
