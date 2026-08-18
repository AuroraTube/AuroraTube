/** Search domain types (normalized). */

import type { Thumbnail, VideoSummary } from './video'

export type SearchType = 'all' | 'video' | 'channel' | 'playlist'

export type SearchChannelSummary = {
  id: string
  name: string
  handle?: string
  avatar?: string
  subscribersText?: string
}

export type SearchPlaylistSummary = {
  id: string
  title: string
  author?: string
  authorId?: string
  videoCount?: number
  thumbnails: Thumbnail[]
}

export type SearchResults = {
  videos: VideoSummary[]
  channels: SearchChannelSummary[]
  playlists: SearchPlaylistSummary[]
}
