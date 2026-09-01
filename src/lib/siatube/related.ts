import { asArray, isRecord } from '../parse'

/** Related-videos.relatedVideos from live SiaTube /api/video. */
export function relatedVideoList(source: Record<string, unknown>): unknown[] {
  const block = source['Related-videos']
  if (!isRecord(block)) return []
  return asArray(block.relatedVideos)
}
