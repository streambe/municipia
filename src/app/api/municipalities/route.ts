import { NextResponse } from 'next/server'
import { getMunicipalities } from '@/services/municipalities'

export async function GET() {
  try {
    const municipalities = await getMunicipalities()

    return NextResponse.json(
      {
        municipalities: municipalities.map((m) => ({
          id: m.id,
          slug: m.slug,
          name: m.name,
          province: m.province,
          agentName: m.agent_name,
          agentWelcomeMessage: m.agent_welcome_message,
        })),
      },
      {
        headers: {
          'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch (error) {
    console.error('Municipalities API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
