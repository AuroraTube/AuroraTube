/** Channel domain types (normalized). */

import type { VideoSummary, Thumbnail } from './video'
import type { SearchPlaylistSummary } from './search'

export type ChannelDetail = {
  id: string
  name: string
  handle?: string
  avatar?: string
  banner?: string
  subscribersText?: string
  description?: string
  latestVideos: VideoSummary[]
  /** Continuation token for channel videos pagination. */
  videosContinuation?: string
}

export type ChannelVideosPage = {
  videos: VideoSummary[]
  continuation?: string
}

export type ChannelPlaylistsPage = {
  playlists: SearchPlaylistSummary[]
  continuation?: string
}

/** Attachment on a community post (simplified). */
export type ChannelPostAttachment =
  | { type: 'image'; thumbnails: Thumbnail[] }
  | { type: 'multiImage'; images: Thumbnail[][] }
  | { type: 'video'; video: VideoSummary }
  | { type: 'playlist'; playlist: SearchPlaylistSummary }
  | { type: 'poll'; totalVotes?: number; choices: { text: string }[] }
  | { type: 'unknown' }

export type ChannelPost = {
  id: string
  author: string
  authorAvatar?: string
  content?: string
  publishedText?: string
  likeCount?: number
  replyCount?: number
  attachment?: ChannelPostAttachment
}

export type ChannelCommunityPage = {
  posts: ChannelPost[]
  continuation?: string
}
