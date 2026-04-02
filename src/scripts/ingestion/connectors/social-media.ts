/**
 * Social Media connector — Stub for future API-based social media ingestion.
 *
 * This connector documents how MunicipIA would connect to official
 * municipal social media accounts via their respective APIs.
 *
 * IMPORTANT: NO scraping is performed. All data must come from official APIs.
 *
 * Supported platforms (future):
 * - Facebook/Instagram Graph API (requires Meta App Review approval)
 * - Twitter/X API v2 (requires developer account + elevated access)
 *
 * For now, this returns an empty result and logs the requirement for API credentials.
 */

import { emptyResult, type IngestResult } from '../types'

// ---------------------------------------------------------------------------
// Platform configuration (for future use)
// ---------------------------------------------------------------------------

export interface SocialMediaConfig {
  platform: 'facebook' | 'instagram' | 'twitter'
  apiKeyEnvVar: string
  apiUrl: string
  requiredSetup: string
}

export const PLATFORMS: SocialMediaConfig[] = [
  {
    platform: 'facebook',
    apiKeyEnvVar: 'FACEBOOK_PAGE_ACCESS_TOKEN',
    apiUrl: 'https://graph.facebook.com/v19.0',
    requiredSetup:
      'Create a Meta App at https://developers.facebook.com/, ' +
      'add Facebook Pages API, submit for App Review, ' +
      'generate a Page Access Token for the municipal page.',
  },
  {
    platform: 'instagram',
    apiKeyEnvVar: 'INSTAGRAM_ACCESS_TOKEN',
    apiUrl: 'https://graph.facebook.com/v19.0',
    requiredSetup:
      'Same Meta App as Facebook. Add Instagram Basic Display API or ' +
      'Instagram Graph API. Requires business account linked to a Facebook Page.',
  },
  {
    platform: 'twitter',
    apiKeyEnvVar: 'TWITTER_BEARER_TOKEN',
    apiUrl: 'https://api.twitter.com/2',
    requiredSetup:
      'Apply for a Twitter/X developer account at https://developer.twitter.com/. ' +
      'Requires at least Basic tier ($100/mo) for search endpoints. ' +
      'Use Bearer Token for app-only authentication.',
  },
]

// ---------------------------------------------------------------------------
// Main connector
// ---------------------------------------------------------------------------

export async function ingestSocialMedia(
  municipalityName: string,
  municipalityId: string
): Promise<IngestResult> {
  const result = emptyResult('social_media', municipalityId)
  const startTime = Date.now()

  console.log(`  [social-media] Checking social media API credentials for ${municipalityName}...`)

  // Check which platforms have credentials configured
  const configured: string[] = []
  const missing: string[] = []

  for (const platform of PLATFORMS) {
    const key = process.env[platform.apiKeyEnvVar]
    if (key && key.length > 0) {
      configured.push(platform.platform)
    } else {
      missing.push(platform.platform)
    }
  }

  if (missing.length > 0) {
    console.log(
      `  [social-media] Social media ingestion requires API credentials. ` +
      `Missing: ${missing.join(', ')}. ` +
      `See connector source for setup instructions.`
    )
  }

  if (configured.length === 0) {
    console.log(
      `  [social-media] No social media API credentials configured. ` +
      `Skipping social media ingestion for ${municipalityName}.`
    )
    result.duration = Date.now() - startTime
    return result
  }

  // Future: call each configured platform's API here
  console.log(
    `  [social-media] Configured platforms: ${configured.join(', ')}. ` +
    `API integration not yet implemented (planned for Sprint 4+).`
  )

  result.duration = Date.now() - startTime
  return result
}
