import type { PlaylistDetail } from '../../shared/types'
import { CACHE_TTL } from '../../lib/config'
import { buildCacheKey, cachedJson } from '../../lib/cache'
import { fetchUpstreamJson } from '../../lib/upstream'
import { normalizePlaylistDetail } from '../../lib/transformers'
import { playlistPath } from '../../lib/paths'

export async function getPlaylistDetail(playlistId: string): Promise<PlaylistDetail> {
  const cacheKey = buildCacheKey('playlist', [playlistId])
  return cachedJson(
    cacheKey,
    CACHE_TTL.playlist,
    async () => normalizePlaylistDetail(await fetchUpstreamJson(playlistPath(playlistId))),
  )
}
