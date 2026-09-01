import type { VideoSummary } from '@shared/types'
import { STORAGE_KEYS, getLocalStorage, writeJsonItem } from '@/lib/storage'

const MAX_RECENT = 5

function isVideoSummary(value: unknown): value is VideoSummary {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as VideoSummary).id === 'string' &&
    typeof (value as VideoSummary).title === 'string' &&
    typeof (value as VideoSummary).author === 'string'
  )
}

function isVideoSummaryList(value: unknown): value is VideoSummary[] {
  return Array.isArray(value) && value.every(isVideoSummary)
}

export function readRecentVideos(): VideoSummary[] {
  const store = getLocalStorage()
  if (!store) return []
  try {
    const raw = store.getItem(STORAGE_KEYS.recentVideos)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!isVideoSummaryList(parsed)) return []
    return parsed.slice(0, MAX_RECENT)
  } catch {
    return []
  }
}

export function persistRecentVideo(video: VideoSummary): void {
  if (!video.id || !video.title) return
  const summary: VideoSummary = {
    id: video.id,
    title: video.title,
    author: video.author || 'Unknown',
    authorId: video.authorId,
    authorAvatar: video.authorAvatar,
    durationText: video.durationText,
    publishedText: video.publishedText,
    viewCount: video.viewCount,
    thumbnails: Array.isArray(video.thumbnails) ? video.thumbnails.slice(0, 1) : [],
    badges: video.badges,
  }
  const next = [summary, ...readRecentVideos().filter((item) => item.id !== video.id)].slice(
    0,
    MAX_RECENT,
  )
  writeJsonItem(STORAGE_KEYS.recentVideos, next)
}
