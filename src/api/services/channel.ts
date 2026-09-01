import type {
  ChannelCommunityPage,
  ChannelDetail,
  ChannelPlaylistsPage,
  ChannelVideosPage,
} from '../../shared/types'
import { CACHE_TTL } from '../../lib/config'
import { buildCacheKey, cachedJson } from '../../lib/cache'
import { fetchUpstreamJson } from '../../lib/upstream'
import {
  normalizeChannelCommunityPage,
  normalizeChannelDetail,
  normalizeChannelPlaylistsPage,
  normalizeChannelVideosPage,
} from '../../lib/transformers'
import { applyChannelAuthor } from '../../shared/videoAuthor'
import {
  channelCommunityPath,
  channelPath,
  channelPlaylistsPath,
  channelStreamsPath,
  channelVideosPath,
} from '../../lib/paths'

/**
 * Channel metadata + first video page (parallel).
 * Videos endpoint supplies the continuation token used by “load more”.
 * Image embed runs once on the combined payload (not on a nested videos cache write).
 */
export async function getChannelDetail(channelId: string): Promise<ChannelDetail> {
  const cacheKey = buildCacheKey('channel', [channelId])
  return cachedJson(
    cacheKey,
    CACHE_TTL.channel,
    async () => {
      const [rawDetail, rawVideos] = await Promise.all([
        fetchUpstreamJson(channelPath(channelId)),
        fetchUpstreamJson(channelVideosPath(channelId)).catch(() => null),
      ])

      const detail = normalizeChannelDetail(rawDetail)
      const author = {
        id: detail.id || channelId,
        name: detail.name,
        avatar: detail.avatar,
      }

      // Prefer /videos page when available (has continuation); else latestVideos from detail.
      const fromVideos =
        rawVideos != null ? normalizeChannelVideosPage(rawVideos) : null
      const latestVideos =
        fromVideos && fromVideos.videos.length > 0
          ? fromVideos.videos
          : detail.latestVideos
      const videosContinuation =
        fromVideos?.continuation ?? detail.videosContinuation

      return {
        ...detail,
        latestVideos: applyChannelAuthor(latestVideos, author),
        videosContinuation,
      }
    },
  )
}

function loadChannelPage<T>(
  kind: string,
  channelId: string,
  continuation: string | undefined,
  path: string,
  normalize: (raw: unknown) => T,
): Promise<T> {
  return cachedJson(
    buildCacheKey(kind, [channelId, continuation ?? '']),
    CACHE_TTL.channel,
    async () => normalize(await fetchUpstreamJson(path)),
  )
}

export function getChannelVideos(
  channelId: string,
  continuation?: string,
): Promise<ChannelVideosPage> {
  return loadChannelPage(
    'channelVideos',
    channelId,
    continuation,
    channelVideosPath(channelId, continuation),
    normalizeChannelVideosPage,
  )
}

export function getChannelStreams(
  channelId: string,
  continuation?: string,
): Promise<ChannelVideosPage> {
  return loadChannelPage(
    'channelStreams',
    channelId,
    continuation,
    channelStreamsPath(channelId, continuation),
    normalizeChannelVideosPage,
  )
}

export function getChannelPlaylists(
  channelId: string,
  continuation?: string,
): Promise<ChannelPlaylistsPage> {
  return loadChannelPage(
    'channelPlaylists',
    channelId,
    continuation,
    channelPlaylistsPath(channelId, continuation),
    normalizeChannelPlaylistsPage,
  )
}

export function getChannelCommunity(
  channelId: string,
  continuation?: string,
): Promise<ChannelCommunityPage> {
  return loadChannelPage(
    'channelCommunity',
    channelId,
    continuation,
    channelCommunityPath(channelId, continuation),
    normalizeChannelCommunityPage,
  )
}
