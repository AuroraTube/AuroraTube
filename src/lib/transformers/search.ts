import type {
  SearchChannelSummary,
  SearchPlaylistSummary,
  SearchResults,
  VideoSummary,
} from '../../shared/types'
import { asString, isRecord } from '../parse'
import { toChannelSummary } from './channel'
import { toPlaylistSummary } from './playlist'
import { toVideoSummary } from './video'

type ItemKind = 'video' | 'channel' | 'playlist' | 'unknown'

/**
 * Detect search result item kind from official `type` field.
 * @see https://docs.invidious.io/api/
 */
export function detectKind(item: Record<string, unknown>): ItemKind {
  const type = asString(item.type)?.toLowerCase()
  if (type === 'video') return 'video'
  if (type === 'channel') return 'channel'
  if (type === 'playlist') return 'playlist'
  // Structural fallbacks using official fields only (no type present).
  if (asString(item.videoId)) return 'video'
  if (asString(item.playlistId)) return 'playlist'
  if (asString(item.authorId) && item.subCount != null) return 'channel'
  return 'unknown'
}

export function normalizeSearchResults(source: unknown): SearchResults {
  const items = Array.isArray(source) ? source : []

  const videos: VideoSummary[] = []
  const channels: SearchChannelSummary[] = []
  const playlists: SearchPlaylistSummary[] = []

  for (const raw of items) {
    if (!isRecord(raw)) continue
    switch (detectKind(raw)) {
      case 'video':
        videos.push(toVideoSummary(raw))
        break
      case 'channel':
        channels.push(toChannelSummary(raw))
        break
      case 'playlist':
        playlists.push(toPlaylistSummary(raw))
        break
    }
  }

  return { videos, channels, playlists }
}
