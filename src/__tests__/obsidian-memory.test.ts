import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getObsidianMemory } from '@/services/obsidian-memory'
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs'
import { join } from 'path'

const VAULT_PATH = join(process.cwd(), 'obsidian-vault')
const TEST_MUNI_DIR = join(VAULT_PATH, 'Municipios', 'Vicente López')
const TEST_CONV_DIR = join(VAULT_PATH, 'Conversaciones', '2026-04-03')

// Save originals to restore after tests
let resumenBackup: string | null = null
let insightsBackup: string | null = null

function safeRead(path: string): string | null {
  try {
    if (!existsSync(path)) return null
    const { readFileSync } = require('fs')
    return readFileSync(path, 'utf-8')
  } catch {
    return null
  }
}

beforeEach(() => {
  // Backup existing files
  resumenBackup = safeRead(join(TEST_MUNI_DIR, 'Resumen.md'))
  insightsBackup = safeRead(join(TEST_MUNI_DIR, 'Insights Conversaciones.md'))

  // Ensure directories exist
  mkdirSync(TEST_MUNI_DIR, { recursive: true })
  mkdirSync(TEST_CONV_DIR, { recursive: true })

  // Write test files
  writeFileSync(
    join(TEST_MUNI_DIR, 'Resumen.md'),
    `---
tags: [municipio]
municipio: "Vicente López"
slug: "vicente-lopez"
---

# Vicente López

## Datos de Contacto
- **Telefono**: (011) 4510-5000
- **Web**: https://www.vicentelopez.gov.ar

## Contenido Disponible
- 84 documentos scrapeados
- 25 chunks indexados
`,
    'utf-8'
  )

  writeFileSync(
    join(TEST_MUNI_DIR, 'Insights Conversaciones.md'),
    `---
tags: [insights]
---

# Insights de Conversaciones — Vicente López

## Resumen
- Total conversaciones: 5
- Temas frecuentes: horarios, tramites, catastro
`,
    'utf-8'
  )

  writeFileSync(
    join(TEST_CONV_DIR, 'vicente-lopez-001.md'),
    `---
tags: [conversación]
---

# Conversacion — Vicente López

## Resumen
El ciudadano consulto sobre horarios de atencion del municipio.

## Preguntas
1. Cuales son los horarios?
`,
    'utf-8'
  )
})

afterEach(() => {
  // Restore backups
  if (resumenBackup !== null) {
    writeFileSync(join(TEST_MUNI_DIR, 'Resumen.md'), resumenBackup, 'utf-8')
  }
  if (insightsBackup !== null) {
    writeFileSync(
      join(TEST_MUNI_DIR, 'Insights Conversaciones.md'),
      insightsBackup,
      'utf-8'
    )
  }
  // Clean up test conversation
  try {
    rmSync(join(TEST_CONV_DIR, 'vicente-lopez-001.md'), { force: true })
  } catch {
    // ignore
  }
})

describe('obsidian-memory service', () => {
  describe('getObsidianMemory', () => {
    it('returns combined memory for a valid municipality slug', () => {
      const result = getObsidianMemory('vicente-lopez')

      expect(result.resumen).toBeTruthy()
      expect(result.resumen).toContain('Vicente López')
      expect(result.insights).toBeTruthy()
      expect(result.insights).toContain('Insights')
      expect(result.combined).toContain('Informacion del Municipio')
      expect(result.combined).toContain('Insights de Conversaciones Previas')
    })

    it('returns recent conversation summaries', () => {
      const result = getObsidianMemory('vicente-lopez')

      expect(result.recentConversations.length).toBeGreaterThanOrEqual(1)
      expect(result.recentConversations[0]).toContain('horarios')
    })

    it('returns empty for unknown slug', () => {
      const result = getObsidianMemory('nonexistent-muni')

      expect(result.resumen).toBeNull()
      expect(result.insights).toBeNull()
      expect(result.recentConversations).toHaveLength(0)
      expect(result.combined).toBe('')
    })

    it('strips YAML frontmatter from notes', () => {
      const result = getObsidianMemory('vicente-lopez')

      // The resumen should not contain frontmatter delimiters
      expect(result.resumen).not.toContain('tags:')
      expect(result.resumen).not.toContain('slug:')
    })

    it('gracefully handles missing files', () => {
      // Tigre has skeleton files but no real content
      const result = getObsidianMemory('tigre')

      // Should not throw, should return some data or empty
      expect(result).toBeDefined()
      expect(typeof result.combined).toBe('string')
    })

    it('combined output includes all sections when data exists', () => {
      const result = getObsidianMemory('vicente-lopez')

      expect(result.combined).toContain('### Informacion del Municipio')
      expect(result.combined).toContain('### Insights de Conversaciones Previas')
      expect(result.combined).toContain('### Resumenes de Conversaciones Recientes')
    })
  })
})
