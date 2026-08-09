/**
 * SiaTube author shapes (verified against live /api/video and related cards).
 *
 * Video detail: author = { id, name, subscribers, thumbnail, collaborator?, collaborators? }
 * Related card: channelName, channelAvatar (no channel id)
 */
import { asString, firstString, isRecord, requiredString } from '../parse'
import { thumbFromUnknown } from './thumbs'

export type AuthorInfo = {
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
  return {
    name: requiredString(author.name, 'Unknown'),
    id: asString(author.id),
    avatar:
      asString(author.thumbnail) ?? thumbFromUnknown(author.thumbnails)[0]?.url,
    subscriberText: asString(author.subscribers),
  }
}

/** Related-video card: channelName + channelAvatar only. */
export function authorFromRelated(source: Record<string, unknown>): AuthorInfo {
  return {
    name: requiredString(asString(source.channelName), 'Unknown'),
    avatar: asString(source.channelAvatar),
  }
}
