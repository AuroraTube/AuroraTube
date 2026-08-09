/**
 * Invidious GET /api/v1/comments/:id → CommentsResponse.
 * @see https://docs.invidious.io/api/
 */
import type { CommentItem, CommentsResponse } from '../../shared/types'
import { stripHtml } from '../html'
import { canonicalizeImageUrl } from '../images/canonicalize'
import {
  asArray,
  asNumber,
  asString,
  firstString,
  isRecord,
  mapDefined,
  requiredString,
} from '../parse'
import { continuationFrom } from './continuation'

function toInvidiousComment(source: unknown): CommentItem | null {
  if (!isRecord(source)) return null
  const commentId = requiredString(source.commentId, '')
  if (!commentId) return null

  const rawAvatar = asString(source.authorThumbnail)
  const avatar = rawAvatar ? (canonicalizeImageUrl(rawAvatar) ?? rawAvatar) : undefined

  const replies = isRecord(source.replies) ? source.replies : null
  const plain = asString(source.content)
  const html = asString(source.contentHtml)
  const text = plain ?? (html ? stripHtml(html) : '')
  if (!text) return null

  return {
    commentId,
    text,
    publishedTime: firstString(source.publishedText),
    author: {
      name: requiredString(source.author, 'Unknown'),
      avatar,
      ...(source.authorIsChannelOwner === true ? { isCreator: true } : {}),
    },
    likeCount: asNumber(source.likeCount),
    replyCount: asNumber(replies?.replyCount),
  }
}

export function normalizeInvidiousComments(source: unknown): CommentsResponse {
  const root = isRecord(source) ? source : {}
  return {
    comments: mapDefined(asArray(root.comments), toInvidiousComment),
    continuation: continuationFrom(root),
    totalCount: asNumber(root.commentCount),
  }
}
