import { badRequest } from '../errors'

/**
 * YouTube video IDs are exactly 11 characters from the URL-safe base64 alphabet.
 * Reject anything else to limit abuse surface (path injection, cache key bloat).
 */
export function validateVideoId(value: string): string {
  const trimmed = value.trim()
  if (!/^[A-Za-z0-9_-]{11}$/.test(trimmed)) throw badRequest('Invalid videoId')
  return trimmed
}
