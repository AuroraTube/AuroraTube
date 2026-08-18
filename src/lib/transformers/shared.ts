/**
 * Shared helpers for normalizing Invidious payloads.
 * @see https://docs.invidious.io/api/
 */
import type { Thumbnail } from '../../shared/types'
import { canonicalizeImageUrl } from '../images/canonicalize'
import { asArray, asNumber, asString, isRecord, mapDefined, type RecordLike } from '../parse'

/** Prefer reliable ytimg qualities; maxres frequently 404s. */
const QUALITY_RANK: Record<string, number> = {
  hqdefault: 100,
  high: 95,
  sddefault: 90,
  mqdefault: 80,
  medium: 75,
  default: 50,
  start: 40,
  middle: 40,
  end: 40,
  maxresdefault: 20,
  maxres: 10,
}

function qualityRank(url: string, quality?: string, width?: number): number {
  const q = (quality ?? '').toLowerCase()
  if (q && QUALITY_RANK[q] != null) return QUALITY_RANK[q]
  for (const [name, rank] of Object.entries(QUALITY_RANK)) {
    if (url.includes(`/${name}.`) || url.includes(`/${name}?`)) return rank
  }
  const w = width ?? 0
  if (w >= 320 && w <= 640) return 85
  if (w > 640 && w <= 1280) return 70
  if (w > 1280) return 25
  return 30
}

type RankedThumb = { url: string; width?: number; quality?: string }

function parseThumbItems(value: unknown): RankedThumb[] {
  return mapDefined(asArray(value), (item) => {
    if (typeof item === 'string') {
      const url = canonicalizeImageUrl(item)
      return url ? { url } : null
    }
    if (!isRecord(item)) return null
    const raw = asString(item.url)
    if (!raw) return null
    const url = canonicalizeImageUrl(raw)
    if (!url) return null
    return {
      url,
      width: asNumber(item.width),
      quality: asString(item.quality),
    }
  })
}

/** Public thumbnails: url only (width/height used only for server-side ranking). */
export function normalizeThumbnails(value: unknown): Thumbnail[] {
  return parseThumbItems(value)
    .sort((a, b) => {
      const ra = qualityRank(a.url, a.quality, a.width)
      const rb = qualityRank(b.url, b.quality, b.width)
      if (rb !== ra) return rb - ra
      return (b.width ?? 0) - (a.width ?? 0)
    })
    .map(({ url }) => ({ url }))
}

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

export function collectBadges(item: RecordLike): string[] | undefined {
  const badges: string[] = []
  if (item.liveNow === true) badges.push('LIVE')
  if (item.isUpcoming === true) badges.push('PREMIERE')
  if (item.premium === true) badges.push('Premium')
  return badges.length ? badges : undefined
}

export function handleFromUrl(authorUrl: unknown): string | undefined {
  if (!authorUrl) return undefined
  try {
    const url = new URL(String(authorUrl))
    const parts = url.pathname.split('/').filter(Boolean)
    return parts.at(-1)
  } catch {
    return undefined
  }
}

/** PlaylistObject exposes `playlistThumbnail` (singular string) only. */
export function playlistThumbnails(item: RecordLike): Thumbnail[] {
  const singular = asString(item.playlistThumbnail)
  if (!singular) return []
  const url = canonicalizeImageUrl(singular)
  return url ? [{ url }] : []
}
