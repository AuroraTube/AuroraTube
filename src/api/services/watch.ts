import type { VideoDetail } from '../../shared/types'
import { CACHE_TTL } from '../../lib/config'
import { buildCacheKey, cachedJson } from '../../lib/cache'
import { fetchSiaTubeJson, normalizeSiaTubeVideoDetail } from '../../lib/siatube'

/** Watch metadata: SiaTube only. */
export async function getVideoDetail(videoId: string): Promise<VideoDetail> {
  const cacheKey = buildCacheKey('watch', [videoId])
  return cachedJson(cacheKey, CACHE_TTL.watch, async () => {
    const raw = await fetchSiaTubeJson(
      `/api/video/${encodeURIComponent(videoId)}`,
    )
    return normalizeSiaTubeVideoDetail(raw, videoId)
  })
}
