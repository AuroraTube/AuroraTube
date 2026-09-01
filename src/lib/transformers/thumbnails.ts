/**
 * Invidious thumbnail-list normalization.
 * @see https://docs.invidious.io/api/common_types/
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

export function parseThumbItems(value: unknown): RankedThumb[] {
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

/** PlaylistObject exposes `playlistThumbnail` (singular string) only. */
export function playlistThumbnails(item: RecordLike): Thumbnail[] {
  const singular = asString(item.playlistThumbnail)
  if (!singular) return []
  const url = canonicalizeImageUrl(singular)
  return url ? [{ url }] : []
}
