/**
 * API Route: GET /api/obsidian-memory?slug=vicente-lopez
 *
 * Node.js runtime (NOT edge) — reads Obsidian vault files from disk.
 * Returns long-term memory context for a municipality.
 */

export const runtime = 'nodejs'

import { getObsidianMemory } from '@/services/obsidian-memory'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')

  if (!slug) {
    return new Response(
      JSON.stringify({ error: 'slug query parameter is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const memory = getObsidianMemory(slug)
    return new Response(JSON.stringify(memory), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Obsidian memory error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to read obsidian memory' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
