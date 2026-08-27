import type { VideoSummary } from './types'

export type ChannelAuthor = {
  id: string
  name: string
  avatar?: string
}

/** Stamp channel identity onto video rows (Invidious omits author fields on channel lists). */
export function applyChannelAuthor(
  videos: VideoSummary[],
  author: ChannelAuthor,
): VideoSummary[] {
  if (!videos.length) return videos
  return videos.map((v) => ({
    ...v,
    author: author.name || v.author,
    authorId: author.id || v.authorId,
    authorAvatar: author.avatar || v.authorAvatar,
  }))
}
