import { NextResponse } from 'next/server'
import { getMunicipalityBySlug } from '@/services/municipalities'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'Invalid slug parameter' },
        { status: 400 }
      )
    }

    const municipality = await getMunicipalityBySlug(slug)

    if (!municipality) {
      return NextResponse.json(
        { error: 'Municipality not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: municipality.id,
      slug: municipality.slug,
      name: municipality.name,
      province: municipality.province,
      phone: municipality.phone,
      website: municipality.website,
      email: municipality.email,
      address: municipality.address,
      agentName: municipality.agent_name,
      agentWelcomeMessage: municipality.agent_welcome_message,
      timezone: municipality.timezone,
    })
  } catch (error) {
    console.error('Municipality by slug error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
