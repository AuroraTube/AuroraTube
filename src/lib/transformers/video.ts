import type { VideoSummary } from '../../shared/types'
import { asNumber, asString, firstString, isRecord, requiredString } from '../parse'
import { parseLooseCount } from '../parseCount'
import { formatClockDuration } from '../../shared/format'
import { collectBadges } from './badges'
import { resolveAvatar } from './avatar'
import { normalizeThumbnails } from './thumbnails'

/**
 * Invidious VideoObject → VideoSummary.
 * @see https://docs.invidious.io/api/common_types/
 */
export function toVideoSummary(source: unknown): VideoSummary {
  const item = isRecord(source) ? source : {}
  const durationSeconds = asNumber(item.lengthSeconds)

  return {
    id: requiredString(item.videoId, ''),
    title: requiredString(item.title, 'Untitled'),
    author: requiredString(item.author, 'Unknown'),
    authorId: asString(item.authorId),
    authorAvatar: resolveAvatar(item.authorThumbnails),
    durationText:
      durationSeconds !== undefined ? formatClockDuration(durationSeconds) : undefined,
    publishedText: firstString(item.publishedText),
    viewCount:
      asNumber(item.viewCount) ?? parseLooseCount(asString(item.viewCountText) ?? ''),
    thumbnails: normalizeThumbnails(item.videoThumbnails),
    badges: collectBadges(item),
  }
}
