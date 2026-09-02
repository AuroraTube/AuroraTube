import type { Thumbnail } from '../../shared/types'
import { canonicalizeImageUrl } from '../images/canonicalize'
import { asString, isRecord, mapDefined } from '../parse'

/**
 * SiaTube aggregates from Invidious-style sources, so thumbnail/avatar URLs
 * here can arrive as Invidious image-proxy paths (`/vi/...`, `/ggpht/...`,
 * possibly on hosts outside our own allowlisted instances) rather than
 * canonical Google CDN URLs. Unwrap them the same way the Invidious pipeline
 * does, so they resolve to `i.ytimg.com` / `yt3.ggpht.com` hosts the media
 * proxy always allows — otherwise the client-side proxy rejects unknown
 * hosts and the image never loads.
 */
export function thumbFromUnknown(value: unknown): Thumbnail[] {
  if (Array.isArray(value)) {
    return mapDefined(value, (item) => {
      if (typeof item === 'string') {
        const url = canonicalizeImageUrl(asString(item) ?? '')
        return url ? { url } : null
      }
      if (!isRecord(item)) return null
      const raw = asString(item.url)
      if (!raw) return null
      const url = canonicalizeImageUrl(raw)
      return url ? { url } : null
    })
  }
  if (isRecord(value)) {
    const raw = asString(value.url)
    if (raw) {
      const url = canonicalizeImageUrl(raw)
      if (url) return [{ url }]
    }
  }
  if (typeof value === 'string') {
    const url = canonicalizeImageUrl(asString(value) ?? '')
    if (url) return [{ url }]
  }
  return []
}

export function firstNonEmptyThumbs(...candidates: unknown[]): Thumbnail[] {
  for (const c of candidates) {
    const thumbs = thumbFromUnknown(c)
    if (thumbs.length) return thumbs
  }
  return []
}
