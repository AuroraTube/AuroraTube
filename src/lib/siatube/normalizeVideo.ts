/**
 * Normalize SiaTube `/api/video/:id` → VideoDetail.
 * Field names verified against live response (2026-08-07).
 */
import type { VideoDetail, VideoSummary } from '../../shared/types'
import { formatDuration, parseClockDuration } from '../duration'
import {
  asString,
  firstString,
  isRecord,
  mapDefined,
  requiredString,
} from '../parse'
import { parseLooseCount } from '../parseCount'
import { authorFromRelated, authorFromVideo } from './author'
import { badgeList } from './badges'
import { descriptionFrom, likeCountFrom, viewsFrom } from './fields'
import { relatedVideoList } from './related'
import { firstNonEmptyThumbs } from './thumbs'

/** Related card → VideoSummary (live fields only). */
function toSiaTubeVideoSummary(source: unknown): VideoSummary | null {
  if (!isRecord(source)) return null

  const type = asString(source.type)?.toLowerCase()
  if (type === 'playlist') return null

  const id = requiredString(source.videoId, '')
  if (!id) return null

  // Live related cards use `duration` (clock string or null); no lengthSeconds.
  const durationRaw = asString(source.duration)
  const parsed = parseClockDuration(durationRaw)
  const author = authorFromRelated(source)

  return {
    id,
    title: requiredString(source.title, 'Untitled'),
    author: author.name,
    authorId: author.id,
    authorAvatar: author.avatar,
    durationText:
      parsed.durationText ??
      (parsed.durationSeconds !== undefined
        ? formatDuration(parsed.durationSeconds)
        : undefined),
    publishedText: firstString(source.publishedTimeText),
    viewCount: parseLooseCount(asString(source.viewCountText) ?? ''),
    thumbnails: firstNonEmptyThumbs(source.thumbnails, source.thumbnail),
  }
}

export function normalizeSiaTubeVideoDetail(
  source: unknown,
  videoId: string,
): VideoDetail {
  const root = isRecord(source) ? source : {}
  const author = authorFromVideo(root)
  const id = requiredString(root.id, videoId)

  return {
    id,
    title: requiredString(root.title, 'Untitled'),
    author: author.name,
    authorId: author.id,
    authorAvatar: author.avatar,
    publishedText: firstString(root.relativeDate),
    viewCount: viewsFrom(root),
    thumbnails: firstNonEmptyThumbs(root.thumbnail),
    description: descriptionFrom(root),
    subscriberText: author.subscriberText,
    likeCount: likeCountFrom(root),
    recommendedVideos: mapDefined(relatedVideoList(root), toSiaTubeVideoSummary).filter(
      (v): v is VideoSummary => v != null && Boolean(v.id),
    ),
    badges: badgeList(root),
  }
}
