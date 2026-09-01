/**
 * SiaTube author shapes (verified against live /api/video and related cards).
 *
 * Video detail: author = { id, name, subscribers, thumbnail, collaborator?, collaborators? }
 * Related card: channelName, channelAvatar (no channel id)
 */
import { asString, isRecord, requiredString } from '../parse'
import { canonicalizeImageUrl } from '../images/canonicalize'
import { thumbFromUnknown } from './thumbs'

type AuthorInfo = {
  name: string
  id?: string
  avatar?: string
  subscriberText?: string
}

export function authorFromVideo(source: Record<string, unknown>): AuthorInfo {
  const author = source.author
  if (!isRecord(author)) {
    return { name: 'Unknown' }
  }
  const rawAvatar = asString(author.thumbnail)
  return {
    name: requiredString(author.name, 'Unknown'),
    id: asString(author.id),
    avatar:
      (rawAvatar ? canonicalizeImageUrl(rawAvatar) : undefined) ??
      thumbFromUnknown(author.thumbnails)[0]?.url,
    subscriberText: asString(author.subscribers),
  }
}

/** Related-video card: channelName + channelAvatar only. */
export function authorFromRelated(source: Record<string, unknown>): AuthorInfo {
  const rawAvatar = asString(source.channelAvatar)
  return {
    name: requiredString(asString(source.channelName), 'Unknown'),
    avatar: rawAvatar ? (canonicalizeImageUrl(rawAvatar) ?? undefined) : undefined,
  }
}
