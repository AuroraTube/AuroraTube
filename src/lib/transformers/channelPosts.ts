/**
 * Invidious GET /api/v1/channels/:id/community → ChannelCommunityPage.
 * @see https://docs.invidious.io/api/channels_endpoint/
 */
import type {
  ChannelCommunityPage,
  ChannelPost,
  ChannelPostAttachment,
} from '../../shared/types'
import { stripHtml } from '../html'
import {
  asArray,
  asNumber,
  asString,
  firstString,
  isRecord,
  mapDefined,
} from '../parse'
import { continuationFrom } from './continuation'
import { asRecord, authorAvatarFrom, authorNameFrom } from './authorFields'
import { normalizeThumbnails } from './thumbnails'
import { toPlaylistSummary } from './playlist'
import { toVideoSummary } from './video'

function toPostAttachment(raw: unknown): ChannelPostAttachment | undefined {
  if (!isRecord(raw)) return undefined
  const type = (asString(raw.type) ?? '').toLowerCase()

  if (type === 'image') {
    const thumbs = normalizeThumbnails(raw.imageThumbnails)
    return thumbs.length ? { type: 'image', thumbnails: thumbs } : undefined
  }

  // Official type is "multiImage"
  if (type === 'multiimage') {
    const images = mapDefined(asArray(raw.images), (group) => {
      const thumbs = normalizeThumbnails(group)
      return thumbs.length ? thumbs : null
    })
    return images.length ? { type: 'multiImage', images } : undefined
  }

  if (type === 'video') {
    const video = toVideoSummary(raw)
    return video.id ? { type: 'video', video } : undefined
  }

  if (type === 'playlist') {
    const playlist = toPlaylistSummary(raw)
    return playlist.id ? { type: 'playlist', playlist } : undefined
  }

  if (type === 'poll') {
    const choices = mapDefined(asArray(raw.choices), (c) => {
      if (!isRecord(c)) return null
      const text = asString(c.text) ?? ''
      return text ? { text } : null
    })
    return { type: 'poll', totalVotes: asNumber(raw.totalVotes), choices }
  }

  if (type === 'unknown' || type) return { type: 'unknown' }
  return undefined
}

function toChannelPost(source: unknown): ChannelPost | null {
  const item = asRecord(source)
  const id = asString(item.commentId) ?? ''
  if (!id) return null

  const plain = asString(item.content)
  const html = asString(item.contentHtml)

  return {
    id,
    author: authorNameFrom(item, asString(item.author) ?? ''),
    authorAvatar: authorAvatarFrom(item),
    content: plain ?? (html ? stripHtml(html) : undefined),
    publishedText: firstString(item.publishedText),
    likeCount: asNumber(item.likeCount),
    replyCount: asNumber(item.replyCount),
    attachment: toPostAttachment(item.attachment),
  }
}

export function normalizeChannelCommunityPage(source: unknown): ChannelCommunityPage {
  const root = asRecord(source)
  // Official field is "comments" (array of posts).
  const posts = mapDefined(asArray(root.comments), toChannelPost).filter(
    (p): p is ChannelPost => p != null,
  )
  return {
    posts,
    continuation: continuationFrom(root),
  }
}
