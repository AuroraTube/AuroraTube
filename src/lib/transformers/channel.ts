import type {
  ChannelDetail,
  ChannelPlaylistsPage,
  ChannelVideosPage,
  SearchChannelSummary,
} from '../../shared/types'
import { formatCompactCount } from '../formatCount'
import { asArray, asNumber, asString, mapDefined, requiredString } from '../parse'
import {
  asRecord,
  authorAvatarFrom,
  authorHandleFrom,
  authorIdFrom,
  authorNameFrom,
} from './authorFields'
import { resolveBanner } from './shared'
import { toPlaylistSummary } from './playlist'
import { toVideoSummary } from './video'
import { continuationFrom } from './continuation'

/**
 * Channel / ChannelObject subscriber text from official `subCount` only.
 * @see https://docs.invidious.io/api/channels_endpoint/
 * @see https://docs.invidious.io/api/common_types/
 */
function subscribersTextFrom(item: Record<string, unknown>): string | undefined {
  const subCount = asNumber(item.subCount)
  return subCount !== undefined ? formatCompactCount(subCount) : undefined
}

export function toChannelSummary(source: unknown): SearchChannelSummary {
  const item = asRecord(source)
  return {
    id: requiredString(authorIdFrom(item), ''),
    name: authorNameFrom(item),
    handle: authorHandleFrom(item),
    avatar: authorAvatarFrom(item),
    subscribersText: subscribersTextFrom(item),
  }
}

export function normalizeChannelDetail(source: unknown): ChannelDetail {
  const item = asRecord(source)
  const id = requiredString(authorIdFrom(item), '')
  const name = authorNameFrom(item)
  const avatar = authorAvatarFrom(item)

  return {
    id,
    name,
    handle: authorHandleFrom(item),
    avatar,
    banner: resolveBanner(item.authorBanners),
    subscribersText: subscribersTextFrom(item),
    description: asString(item.description),
    latestVideos: mapDefined(asArray(item.latestVideos), toVideoSummary),
    videosContinuation: continuationFrom(item),
  }
}

export function normalizeChannelVideosPage(source: unknown): ChannelVideosPage {
  const root = asRecord(source)
  return {
    videos: mapDefined(asArray(root.videos), toVideoSummary).filter((v) => Boolean(v.id)),
    continuation: continuationFrom(root),
  }
}

export function normalizeChannelPlaylistsPage(source: unknown): ChannelPlaylistsPage {
  const root = asRecord(source)
  return {
    playlists: mapDefined(asArray(root.playlists), toPlaylistSummary).filter((p) =>
      Boolean(p.id),
    ),
    continuation: continuationFrom(root),
  }
}
