/**
 * Obsidian Vault Sync Script
 *
 * Reads municipalities, documents, chunks and conversations from Supabase
 * and generates/updates Obsidian vault markdown notes.
 *
 * Usage:
 *   npx tsx scripts/obsidian/sync-vault.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const VAULT_PATH = join(process.cwd(), 'obsidian-vault')

const MUNICIPALITIES = [
  { slug: 'vicente-lopez', name: 'Vicente López', folder: 'Vicente López' },
  { slug: 'san-isidro', name: 'San Isidro', folder: 'San Isidro' },
  { slug: 'moron', name: 'Morón', folder: 'Morón' },
  { slug: 'la-plata', name: 'La Plata', folder: 'La Plata' },
  { slug: 'lanus', name: 'Lanús', folder: 'Lanús' },
  { slug: 'general-rodriguez', name: 'General Rodríguez', folder: 'General Rodríguez' },
  { slug: 'ameghino', name: 'Florentino Ameghino', folder: 'Ameghino' },
  { slug: 'tigre', name: 'Tigre', folder: 'Tigre' },
]

function createSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key)
}

function ensureDir(dirPath: string) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
  }
}

function writeNote(filePath: string, content: string) {
  writeFileSync(filePath, content, 'utf-8')
}

const today = new Date().toISOString().split('T')[0]

interface MunicipalityRow {
  id: string
  slug: string
  name: string
  phone: string | null
  website: string | null
  email: string | null
  address: string | null
}

interface DocumentRow {
  id: string
  url: string
  title: string | null
  content_length: number | null
  source_type: string | null
  created_at: string
}

interface ChunkRow {
  id: string
}

interface ConversationRow {
  id: string
  started_at: string
  last_message_at: string
}

interface MessageRow {
  role: string
  content: string
}

async function syncMunicipality(
  supabase: SupabaseClient,
  muni: (typeof MUNICIPALITIES)[number]
) {
  console.log(`\nSyncing ${muni.name}...`)

  // Fetch municipality from DB
  const { data: munRow } = await supabase
    .from('municipalities')
    .select('id, slug, name, phone, website, email, address')
    .eq('slug', muni.slug)
    .maybeSingle()

  if (!munRow) {
    console.log(`  Municipality ${muni.slug} not found in DB, creating skeleton notes`)
    const muniDir = join(VAULT_PATH, 'Municipios', muni.folder)
    ensureDir(muniDir)
    writeNote(join(muniDir, 'Resumen.md'), generateResumenNote(muni, null, 0, 0))
    writeNote(join(muniDir, 'Paginas Scrapeadas.md'), generatePaginasNote(muni, []))
    writeNote(join(muniDir, 'Insights Conversaciones.md'), generateInsightsNote(muni, []))
    writeNote(join(muniDir, 'Estadisticas.md'), generateStatsNote(muni, 0, 0, 0))
    return { docs: 0, chunks: 0, conversations: 0, status: 'Pendiente' }
  }

  const m = munRow as MunicipalityRow

  // Fetch documents
  const { data: docs } = await supabase
    .from('documents')
    .select('id, url, title, content_length, source_type, created_at')
    .eq('municipality_id', m.id)
    .order('created_at', { ascending: false })

  const documents = (docs ?? []) as DocumentRow[]

  // Count chunks
  const { count: chunksCount } = await supabase
    .from('document_chunks')
    .select('id', { count: 'exact', head: true })
    .eq('municipality_id', m.id)

  // Fetch conversations
  const { data: convs } = await supabase
    .from('conversations')
    .select('id, started_at, last_message_at')
    .eq('municipality_id', m.id)
    .order('started_at', { ascending: false })
    .limit(20)

  const conversations = (convs ?? []) as ConversationRow[]

  const muniDir = join(VAULT_PATH, 'Municipios', muni.folder)
  ensureDir(muniDir)

  // Extract topics from document titles
  const topics = extractTopics(documents)

  // Generate notes
  writeNote(
    join(muniDir, 'Resumen.md'),
    generateResumenNote(muni, m, documents.length, chunksCount ?? 0, topics)
  )
  writeNote(
    join(muniDir, 'Paginas Scrapeadas.md'),
    generatePaginasNote(muni, documents)
  )
  writeNote(
    join(muniDir, 'Insights Conversaciones.md'),
    generateInsightsNote(muni, conversations)
  )
  writeNote(
    join(muniDir, 'Estadisticas.md'),
    generateStatsNote(muni, documents.length, chunksCount ?? 0, conversations.length)
  )

  console.log(
    `  ${muni.name}: ${documents.length} docs, ${chunksCount ?? 0} chunks, ${conversations.length} conversations`
  )

  return {
    docs: documents.length,
    chunks: chunksCount ?? 0,
    conversations: conversations.length,
    status: documents.length > 0 ? 'Activo' : 'Pendiente',
  }
}

function extractTopics(documents: DocumentRow[]): string[] {
  const titleWords: Record<string, number> = {}
  for (const doc of documents) {
    if (!doc.title) continue
    const words = doc.title
      .toLowerCase()
      .split(/[\s\-|:,]+/)
      .filter((w) => w.length > 3)
    for (const w of words) {
      titleWords[w] = (titleWords[w] ?? 0) + 1
    }
  }
  return Object.entries(titleWords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1))
}

function generateResumenNote(
  muni: (typeof MUNICIPALITIES)[number],
  row: MunicipalityRow | null,
  docsCount: number,
  chunksCount: number,
  topics?: string[]
): string {
  const phone = row?.phone ?? 'No disponible'
  const website = row?.website ?? 'No disponible'
  const email = row?.email ?? 'No disponible'
  const address = row?.address ?? 'No disponible'

  const topicsSection =
    topics && topics.length > 0
      ? topics.map((t) => `- ${t}`).join('\n')
      : '- (Sin datos suficientes)'

  return `---
tags: [municipio, buenos-aires]
municipio: "${muni.name}"
slug: "${muni.slug}"
phone: "${phone}"
website: "${website}"
address: "${address}"
última_actualización: "${today}"
---

# ${muni.name}

## Datos de Contacto
- **Telefono**: ${phone}
- **Web**: ${website !== 'No disponible' ? `[${muni.name}](${website})` : 'No disponible'}
- **Email**: ${email}
- **Direccion**: ${address}

## Contenido Disponible
- ${docsCount} documentos scrapeados
- ${chunksCount} chunks indexados

## Temas Principales
${topicsSection}

## Links Internos
- [[Paginas Scrapeadas]]
- [[Insights Conversaciones]]
- [[Estadisticas]]
`
}

function generatePaginasNote(
  muni: (typeof MUNICIPALITIES)[number],
  documents: DocumentRow[]
): string {
  const rows = documents
    .map((d) => {
      const title = d.title ?? '(sin titulo)'
      const url = d.url
      const len = d.content_length ?? 0
      const date = d.created_at?.split('T')[0] ?? ''
      return `| [${title}](${url}) | ${len} chars | ${d.source_type ?? 'web'} | ${date} |`
    })
    .join('\n')

  return `---
tags: [paginas, ${muni.slug}]
municipio: "${muni.name}"
última_actualización: "${today}"
---

# Paginas Scrapeadas — ${muni.name}

Ultima actualizacion: ${today}
Total: ${documents.length} documentos

## Paginas

| URL / Titulo | Largo | Fuente | Fecha Ingestion |
|--------------|-------|--------|-----------------|
${rows || '| (Sin documentos) | - | - | - |'}
`
}

function generateInsightsNote(
  muni: (typeof MUNICIPALITIES)[number],
  conversations: ConversationRow[]
): string {
  const convLinks = conversations
    .slice(0, 10)
    .map((c) => {
      const date = c.started_at?.split('T')[0] ?? ''
      return `- [[${date}/${muni.slug}-${c.id.slice(0, 8)}]]`
    })
    .join('\n')

  return `---
tags: [insights, ${muni.slug}]
municipio: "${muni.name}"
última_actualización: "${today}"
---

# Insights de Conversaciones — ${muni.name}

## Resumen
- Total conversaciones: ${conversations.length}

## Ultimas Conversaciones
${convLinks || '- (Sin conversaciones registradas)'}
`
}

function generateStatsNote(
  muni: (typeof MUNICIPALITIES)[number],
  docsCount: number,
  chunksCount: number,
  convsCount: number
): string {
  return `---
tags: [estadisticas, ${muni.slug}]
municipio: "${muni.name}"
última_actualización: "${today}"
---

# Estadisticas — ${muni.name}

Ultima actualizacion: ${today}

## Metricas
- **Documentos**: ${docsCount}
- **Chunks indexados**: ${chunksCount}
- **Conversaciones**: ${convsCount}

## Historial de Ingestion
| Fecha | Docs Nuevos | Chunks | Estado |
|-------|-------------|--------|--------|
| ${today} | ${docsCount} | ${chunksCount} | Sync |
`
}

function generateDashboard(
  allStats: Array<{
    muni: (typeof MUNICIPALITIES)[number]
    docs: number
    chunks: number
    conversations: number
    status: string
  }>
) {
  const totalDocs = allStats.reduce((s, r) => s + r.docs, 0)
  const totalChunks = allStats.reduce((s, r) => s + r.chunks, 0)
  const totalConvs = allStats.reduce((s, r) => s + r.conversations, 0)

  const rows = allStats
    .map(
      (s) =>
        `| [[${s.muni.folder}/Resumen\\|${s.muni.name}]] | ${s.docs} | ${s.chunks} | ${s.conversations} | ${s.status} |`
    )
    .join('\n')

  return `---
tags: [dashboard]
última_actualización: "${today}"
---

# MunicipIA — Dashboard

Ultima actualizacion: ${today}

## Estado de Municipios

| Municipio | Docs | Chunks | Conversaciones | Estado |
|-----------|------|--------|----------------|--------|
${rows}

## Estadisticas Globales
- Total documentos: ${totalDocs}
- Total chunks: ${totalChunks}
- Total conversaciones: ${totalConvs}
`
}

async function main() {
  console.log('Obsidian Vault Sync — Starting...')

  const supabase = createSupabaseAdmin()
  const allStats: Array<{
    muni: (typeof MUNICIPALITIES)[number]
    docs: number
    chunks: number
    conversations: number
    status: string
  }> = []

  for (const muni of MUNICIPALITIES) {
    const stats = await syncMunicipality(supabase, muni)
    allStats.push({ muni, ...stats })
  }

  // Generate Dashboard
  writeNote(join(VAULT_PATH, 'Dashboard.md'), generateDashboard(allStats))

  console.log('\nVault sync complete.')
  console.log(
    `Total: ${allStats.reduce((s, r) => s + r.docs, 0)} docs, ${allStats.reduce((s, r) => s + r.chunks, 0)} chunks`
  )
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
