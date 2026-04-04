/**
 * Save Conversation to Obsidian Vault
 *
 * Fetches a conversation from Supabase, generates a summary,
 * and saves it as an Obsidian note.
 *
 * Usage:
 *   npx tsx scripts/obsidian/save-conversation.ts <conversationId>
 *
 * Also exported for programmatic use from the chat API.
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'

const VAULT_PATH = join(process.cwd(), 'obsidian-vault')

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

function ensureDir(dirPath: string) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
  }
}

function getNextConversationNumber(dateDir: string, slug: string): string {
  if (!existsSync(dateDir)) return '001'
  const files = readdirSync(dateDir).filter(
    (f) => f.startsWith(slug) && f.endsWith('.md')
  )
  const num = files.length + 1
  return num.toString().padStart(3, '0')
}

function createSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key)
}

interface MessageRow {
  role: string
  content: string
  created_at: string
}

interface ConversationRow {
  id: string
  municipality_id: string
  started_at: string
}

interface MunicipalityRow {
  slug: string
  name: string
}

/**
 * Save a conversation summary to Obsidian vault.
 * Can be called from the chat API (non-blocking) or from CLI.
 */
export async function saveConversation(
  conversationId: string,
  supabase?: SupabaseClient
): Promise<string | null> {
  const sb = supabase ?? createSupabaseAdmin()

  // Fetch conversation
  const { data: conv } = await sb
    .from('conversations')
    .select('id, municipality_id, started_at')
    .eq('id', conversationId)
    .single()

  if (!conv) {
    console.error(`Conversation ${conversationId} not found`)
    return null
  }

  const conversation = conv as ConversationRow

  // Fetch municipality
  const { data: mun } = await sb
    .from('municipalities')
    .select('slug, name')
    .eq('id', conversation.municipality_id)
    .single()

  if (!mun) {
    console.error(`Municipality ${conversation.municipality_id} not found`)
    return null
  }

  const municipality = mun as MunicipalityRow

  // Fetch messages
  const { data: msgs } = await sb
    .from('messages')
    .select('role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  const messages = (msgs ?? []) as MessageRow[]

  if (messages.length < 2) {
    console.log(`Conversation ${conversationId} has fewer than 2 messages, skipping`)
    return null
  }

  // Extract questions and answers
  const userMessages = messages.filter((m) => m.role === 'user')
  const assistantMessages = messages.filter((m) => m.role === 'assistant')

  const questions = userMessages.map((m, i) => `${i + 1}. ${m.content.slice(0, 200)}`)
  const answers = assistantMessages.map((m, i) => `${i + 1}. ${m.content.slice(0, 200)}`)

  // Generate simple summary (first user message as topic)
  const firstQuestion = userMessages[0]?.content ?? ''
  const summary = `El ciudadano consulto sobre: ${firstQuestion.slice(0, 150)}`

  // Extract topic tags from user messages
  const topicKeywords = extractKeywords(userMessages.map((m) => m.content).join(' '))

  // Determine file path
  const date = conversation.started_at?.split('T')[0] ?? new Date().toISOString().split('T')[0]
  const dateDir = join(VAULT_PATH, 'Conversaciones', date)
  ensureDir(dateDir)

  const num = getNextConversationNumber(dateDir, municipality.slug)
  const fileName = `${municipality.slug}-${num}.md`
  const filePath = join(dateDir, fileName)

  const folder = SLUG_TO_FOLDER[municipality.slug] ?? municipality.name
  const dateTime = conversation.started_at ?? new Date().toISOString()

  const content = `---
tags: [conversación, ${municipality.slug}]
municipio: "${municipality.name}"
fecha: "${date}"
mensajes: ${messages.length}
---

# Conversacion — ${municipality.name}

**Fecha**: ${dateTime}
**Municipio**: [[${folder}/Resumen|${municipality.name}]]
**Mensajes**: ${messages.length}

## Resumen
${summary}

## Preguntas del Ciudadano
${questions.join('\n')}

## Respuestas del Agente
${answers.join('\n')}

## Temas
${topicKeywords.map((k) => `- #${k}`).join('\n')}
`

  writeFileSync(filePath, content, 'utf-8')
  console.log(`Saved conversation to ${filePath}`)

  return filePath
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'que', 'como', 'para', 'por', 'con', 'los', 'las', 'del', 'una', 'uno',
    'este', 'esta', 'eso', 'esa', 'son', 'ser', 'hay', 'tiene', 'puede',
    'donde', 'cuando', 'cual', 'mas', 'muy', 'todo', 'hola', 'buenas',
    'quiero', 'necesito', 'saber', 'hacer', 'queria',
  ])

  const words = text
    .toLowerCase()
    .replace(/[^a-záéíóúñü\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w))

  const freq: Record<string, number> = {}
  for (const w of words) {
    freq[w] = (freq[w] ?? 0) + 1
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word)
}

// CLI entry point
if (require.main === module) {
  const conversationId = process.argv[2]
  if (!conversationId) {
    console.error('Usage: npx tsx scripts/obsidian/save-conversation.ts <conversationId>')
    process.exit(1)
  }
  saveConversation(conversationId)
    .then((path) => {
      if (path) console.log(`Done: ${path}`)
      else console.log('No conversation saved')
      process.exit(0)
    })
    .catch((err) => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}
