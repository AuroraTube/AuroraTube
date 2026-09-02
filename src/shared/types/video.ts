/** Video domain types (normalized). */

export type Thumbnail = {
  url: string
}

export type VideoSummary = {
  id: string
  title: string
  author: string
  authorId?: string
  authorAvatar?: string
  durationText?: string
  publishedText?: string
  viewCount?: number
  thumbnails: Thumbnail[]
  badges?: string[]
}

/** Watch metadata (SiaTube). Playback lives in StreamPayload. */
export type VideoDetail = VideoSummary & {
  description?: string
  subscriberText?: string
  likeCount?: number
  recommendedVideos: VideoSummary[]
}
