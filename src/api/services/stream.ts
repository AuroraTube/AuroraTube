import type { StreamPayload } from '../../shared/types'
import { CACHE_TTL } from '../../lib/config'
import { buildCacheKey, cachedJson } from '../../lib/cache'
import { resolveStreamPayload } from '../../lib/stream/resolve'

/**
 * Cached playback payload.
 * Cascade: STREAM_PROVIDERS (SiaTube → RapidAPI → getlate).
 */
export async function getStreamPayload(videoId: string): Promise<StreamPayload> {
  const cacheKey = buildCacheKey('stream', [videoId])
  return cachedJson(cacheKey, CACHE_TTL.stream, () => resolveStreamPayload(videoId), {
    embedImages: false,
  })
}
