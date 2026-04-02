import { createHash } from 'crypto'

/**
 * Deduplication utilities
 * Prevents re-ingesting documents that haven't changed
 */

export function computeContentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

export function isDuplicate(
  newHash: string,
  existingHashes: Set<string>
): boolean {
  return existingHashes.has(newHash)
}
