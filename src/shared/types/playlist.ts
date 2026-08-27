/** Playlist domain types (normalized). */

import type { VideoSummary } from './video'

export type PlaylistDetail = {
  id: string
  title: string
  author?: string
  authorId?: string
  authorAvatar?: string
  videoCount?: number
  videos: VideoSummary[]
}
