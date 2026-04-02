import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { ingestSocialMedia, PLATFORMS } from './social-media'

describe('ingestSocialMedia', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    // Clear all social media env vars
    for (const p of PLATFORMS) {
      delete process.env[p.apiKeyEnvVar]
    }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('returns empty result when no credentials are configured', async () => {
    const result = await ingestSocialMedia('Vicente Lopez', 'vicente-lopez')
    expect(result.source).toBe('social_media')
    expect(result.municipalityId).toBe('vicente-lopez')
    expect(result.pagesProcessed).toBe(0)
    expect(result.chunksCreated).toBe(0)
    expect(result.errors).toHaveLength(0)
  })

  it('detects configured platforms', async () => {
    process.env.TWITTER_BEARER_TOKEN = 'test-token'

    const result = await ingestSocialMedia('Moron', 'moron')
    expect(result.source).toBe('social_media')
    expect(result.pagesProcessed).toBe(0) // Not yet implemented
  })

  it('includes duration', async () => {
    const result = await ingestSocialMedia('Tigre', 'tigre')
    expect(result.duration).toBeGreaterThanOrEqual(0)
  })

  it('exports platform configurations', () => {
    expect(PLATFORMS).toHaveLength(3)
    expect(PLATFORMS.map((p) => p.platform)).toEqual([
      'facebook',
      'instagram',
      'twitter',
    ])
  })
})
