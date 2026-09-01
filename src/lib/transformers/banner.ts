/** Invidious channel-banner resolution. */
import { canonicalizeImageUrl } from '../images/canonicalize'
import { asArray, asNumber, asString, isRecord, mapDefined } from '../parse'

/** Prefer ~1280px channel banners. */
export function resolveBanner(...candidates: unknown[]): string | undefined {
  for (const value of candidates) {
    if (value == null) continue
    const direct = asString(value)
    if (direct) {
      const url = canonicalizeImageUrl(direct)
      if (url) return url
      continue
    }

    const parsed = mapDefined(asArray(value), (item) => {
      if (typeof item === 'string') {
        const url = canonicalizeImageUrl(item)
        return url ? { url, width: 0 } : null
      }
      if (!isRecord(item)) return null
      const raw = asString(item.url)
      if (!raw) return null
      const url = canonicalizeImageUrl(raw)
      if (!url) return null
      return { url, width: asNumber(item.width) ?? 0 }
    })
    if (!parsed.length) continue

    const preferred =
      parsed.find((t) => t.width >= 1000 && t.width <= 1400) ??
      [...parsed].sort((a, b) => b.width - a.width)[0]
    if (preferred?.url) return preferred.url
  }
  return undefined
}
