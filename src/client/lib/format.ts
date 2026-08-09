import type { VideoSummary } from '@shared/types'
import { formatCompactNumber as formatCompactNumberCore } from '@shared/format'

/** Client UI: optional input → undefined when missing / non-finite. */
export function formatCompactNumber(value?: number): string | undefined {
  if (value == null || !Number.isFinite(value)) return undefined
  return formatCompactNumberCore(value)
}

export function formatNumber(value?: number): string | undefined {
  if (value == null || !Number.isFinite(value)) return undefined
  return new Intl.NumberFormat('ja-JP').format(value)
}

export function joinParts(...parts: Array<string | undefined | null>): string {
  return parts.filter(Boolean).join(' · ')
}

export function videoMeta(video: Pick<VideoSummary, 'viewCount' | 'publishedText'>): string {
  return joinParts(
    video.viewCount != null ? `${formatCompactNumber(video.viewCount)} 回視聴` : undefined,
    video.publishedText,
  )
}

export function thumbnailUrl(thumbnails: Array<{ url: string }> | undefined): string {
  return thumbnails?.[0]?.url ?? ''
}
