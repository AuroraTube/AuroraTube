import type { SearchType } from '../shared/types'
import { TRENDING_REGION } from './config'

/** Invidious API v1 path builders. @see https://docs.invidious.io/api/ */

export function searchPath(
  q: string,
  type: SearchType,
  page: number,
  region: string = TRENDING_REGION,
): string {
  const params = new URLSearchParams({ q, type, page: String(page), region })
  return `/api/v1/search?${params}`
}

export function commentsPath(
  videoId: string,
  sort: 'top' | 'new' = 'top',
  continuation?: string,
): string {
  const params = new URLSearchParams({ sort_by: sort })
  if (continuation) params.set('continuation', continuation)
  return `/api/v1/comments/${encodeURIComponent(videoId)}?${params}`
}

export function channelPath(channelId: string): string {
  return `/api/v1/channels/${encodeURIComponent(channelId)}`
}

export function channelVideosPath(channelId: string, continuation?: string): string {
  const base = `/api/v1/channels/${encodeURIComponent(channelId)}/videos`
  if (!continuation) return base
  return `${base}?continuation=${encodeURIComponent(continuation)}`
}

export function channelStreamsPath(channelId: string, continuation?: string): string {
  const base = `/api/v1/channels/${encodeURIComponent(channelId)}/streams`
  if (!continuation) return base
  return `${base}?continuation=${encodeURIComponent(continuation)}`
}

export function channelPlaylistsPath(channelId: string, continuation?: string): string {
  const base = `/api/v1/channels/${encodeURIComponent(channelId)}/playlists`
  if (!continuation) return base
  return `${base}?continuation=${encodeURIComponent(continuation)}`
}

export function channelCommunityPath(channelId: string, continuation?: string): string {
  const base = `/api/v1/channels/${encodeURIComponent(channelId)}/community`
  if (!continuation) return base
  return `${base}?continuation=${encodeURIComponent(continuation)}`
}

export function playlistPath(playlistId: string): string {
  return `/api/v1/playlists/${encodeURIComponent(playlistId)}`
}

export function trendingPath(): string {
  return `/api/v1/trending?region=${encodeURIComponent(TRENDING_REGION)}&type=default`
}
