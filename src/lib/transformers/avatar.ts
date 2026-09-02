/** Invidious author/channel avatar resolution. */
import { canonicalizeImageUrl } from '../images/canonicalize'
import { asString } from '../parse'
import { parseThumbItems } from './thumbnails'

/** Collect avatar candidates then pick a mid-size usable URL. */
export function resolveAvatar(...candidates: unknown[]): string | undefined {
  const collected: { url: string; width: number }[] = []

  for (const value of candidates) {
    if (value == null) continue
    const direct = asString(value)
    if (direct) {
      const url = canonicalizeImageUrl(direct)
      if (url) collected.push({ url, width: 0 })
      continue
    }
    for (const t of parseThumbItems(value)) {
      if (t.url) collected.push({ url: t.url, width: t.width ?? 0 })
    }
  }

  if (!collected.length) return undefined

  return (
    collected.find((t) => t.width >= 88 && t.width <= 240)?.url ??
    collected.find((t) => t.width >= 48)?.url ??
    [...collected].sort((a, b) => b.width - a.width)[0]?.url
  )
}
