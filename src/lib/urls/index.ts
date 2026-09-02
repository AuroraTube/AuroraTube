import { looksLikeUrlString } from './absolute'
import { unwrapInvidiousImageUrl } from './unwrap'

/**
 * Walk Invidious JSON and absolutize / unwrap image URLs onto Google CDNs.
 * Playback stream URLs are not rewritten here (they are never image-like leaves
 * under /vi/ or /ggpht/ only; googlevideo absolute URLs pass through unchanged).
 */
export function absolutizeUrls(value: unknown, base: string): unknown {
  if (typeof value === 'string') {
    return looksLikeUrlString(value) ? unwrapInvidiousImageUrl(value, base) : value
  }
  if (Array.isArray(value)) return value.map((item) => absolutizeUrls(item, base))

  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      out[key] = absolutizeUrls(child, base)
    }
    return out
  }

  return value
}
