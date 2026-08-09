import type { PlaylistDetail, SearchPlaylistSummary } from '../../shared/types'
import { asArray, asNumber, firstString, mapDefined, requiredString } from '../parse'
import { authorAvatarFrom, authorIdFrom, asRecord } from './authorFields'
import { playlistThumbnails } from './shared'
import { toVideoSummary } from './video'

export function toPlaylistSummary(source: unknown): SearchPlaylistSummary {
  const item = asRecord(source)
  return {
    id: requiredString(item.playlistId, ''),
    title: requiredString(item.title, 'Untitled playlist'),
    author: firstString(item.author),
    authorId: authorIdFrom(item),
    videoCount: asNumber(item.videoCount),
    thumbnails: playlistThumbnails(item),
  }
}

export function normalizePlaylistDetail(source: unknown): PlaylistDetail {
  const item = asRecord(source)
  return {
    id: requiredString(item.playlistId, ''),
    title: requiredString(item.title, 'Untitled playlist'),
    author: firstString(item.author),
    authorId: authorIdFrom(item),
    authorAvatar: authorAvatarFrom(item),
    videoCount: asNumber(item.videoCount),
    videos: mapDefined(asArray(item.videos), toVideoSummary),
  }
}
