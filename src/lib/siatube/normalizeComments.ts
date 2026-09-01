/**
 * Normalize SiaTube `/api/comments` → CommentsResponse.
 *
 * Item: commentId, text, publishedTime,
 *   author { name, avatar, verified, creator },
 *   likes { text, count }, replies { text, count }
 */
import type { CommentItem, CommentsResponse } from '../../shared/types'
import { canonicalizeImageUrl } from '../images/canonicalize'
import { asArray, asNumber, asString, isRecord, mapDefined, requiredString } from '../parse'

function toComment(source: unknown): CommentItem | null {
  if (!isRecord(source)) return null
  const commentId = requiredString(source.commentId, '')
  const text = asString(source.text)
  if (!commentId || !text) return null

  const authorRaw = isRecord(source.author) ? source.author : {}
  const likesRaw = isRecord(source.likes) ? source.likes : {}
  const repliesRaw = isRecord(source.replies) ? source.replies : {}
  const rawAvatar = asString(authorRaw.avatar)

  return {
    commentId,
    text,
    publishedTime: asString(source.publishedTime),
    author: {
      name: requiredString(authorRaw.name, 'Unknown'),
      avatar: rawAvatar ? (canonicalizeImageUrl(rawAvatar) ?? undefined) : undefined,
      ...(authorRaw.verified ? { verified: true } : {}),
      ...(authorRaw.creator ? { isCreator: true } : {}),
    },
    likeCount: asNumber(likesRaw.count),
    likeText: asString(likesRaw.text),
    replyCount: asNumber(repliesRaw.count),
    replyText: asString(repliesRaw.text),
  }
}

export function normalizeComments(source: unknown): CommentsResponse {
  const root = isRecord(source) ? source : {}
  return {
    comments: mapDefined(asArray(root.comments), toComment),
    continuation: asString(root.continuation) ?? asString(root.nextContinuation),
    totalCount: asNumber(root.CommentsCount),
  }
}
