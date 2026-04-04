/**
 * Obsidian Memory Service
 *
 * Reads Obsidian vault notes to provide long-term memory context
 * for the Muni agent. Only reads relevant notes per municipality
 * to minimize token usage.
 *
 * IMPORTANT: Uses Node.js fs — cannot run in Edge Runtime.
 * Must be called from a Node.js API route or script context.
 */

import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'

const VAULT_PATH = join(process.cwd(), 'obsidian-vault')

/** Municipality name mapping from slug */
const SLUG_TO_FOLDER: Record<string, string> = {
  'vicente-lopez': 'Vicente López',
  'san-isidro': 'San Isidro',
  'moron': 'Morón',
  'la-plata': 'La Plata',
  'lanus': 'Lanús',
  'general-rodriguez': 'General Rodríguez',
  'ameghino': 'Ameghino',
  'tigre': 'Tigre',
}

function safeReadFile(filePath: string): string | null {
  try {
    if (!existsSync(filePath)) return null
    return readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }
}

function stripFrontmatter(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/)
  return match ? match[1].trim() : content.trim()
}

/**
 * Get the last N conversation note files for a municipality.
 */
function getRecentConversations(municipalitySlug: string, limit: number = 5): string[] {
  const convDir = join(VAULT_PATH, 'Conversaciones')
  if (!existsSync(convDir)) return []

  const results: { path: string; date: string; name: string }[] = []

  try {
    const dateDirs = readdirSync(convDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()
      .reverse()

    for (const dateDir of dateDirs) {
      const fullDateDir = join(convDir, dateDir)
      const files = readdirSync(fullDateDir)
        .filter((f) => f.startsWith(municipalitySlug) && f.endsWith('.md'))
        .sort()
        .reverse()

      for (const file of files) {
        results.push({ path: join(fullDateDir, file), date: dateDir, name: file })
        if (results.length >= limit) break
      }
      if (results.length >= limit) break
    }
  } catch {
    // Ignore read errors
  }

  return results.map((r) => r.path)
}

export interface ObsidianMemory {
  resumen: string | null
  insights: string | null
  recentConversations: string[]
  combined: string
}

/**
 * Load Obsidian memory for a municipality.
 * Returns a combined string suitable for injection into the system prompt.
 */
export function getObsidianMemory(municipalitySlug: string): ObsidianMemory {
  const folder = SLUG_TO_FOLDER[municipalitySlug]
  if (!folder) {
    return { resumen: null, insights: null, recentConversations: [], combined: '' }
  }

  const muniDir = join(VAULT_PATH, 'Municipios', folder)

  // 1. Read Resumen.md
  const resumenRaw = safeReadFile(join(muniDir, 'Resumen.md'))
  const resumen = resumenRaw ? stripFrontmatter(resumenRaw) : null

  // 2. Read Insights Conversaciones.md
  const insightsRaw = safeReadFile(join(muniDir, 'Insights Conversaciones.md'))
  const insights = insightsRaw ? stripFrontmatter(insightsRaw) : null

  // 3. Read last 5 conversations
  const convPaths = getRecentConversations(municipalitySlug, 5)
  const recentConversations: string[] = []
  for (const p of convPaths) {
    const raw = safeReadFile(p)
    if (raw) {
      // Only include the summary section to save tokens
      const summaryMatch = raw.match(/## Resumen\n([\s\S]*?)(?=\n## |$)/)
      if (summaryMatch) {
        recentConversations.push(summaryMatch[1].trim())
      }
    }
  }

  // 4. Combine into a single context string
  const parts: string[] = []

  if (resumen) {
    parts.push(`### Informacion del Municipio\n${resumen}`)
  }

  if (insights) {
    parts.push(`### Insights de Conversaciones Previas\n${insights}`)
  }

  if (recentConversations.length > 0) {
    parts.push(
      `### Resumenes de Conversaciones Recientes\n${recentConversations.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
    )
  }

  return {
    resumen,
    insights,
    recentConversations,
    combined: parts.join('\n\n'),
  }
}
