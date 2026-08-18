import type { TrendingResponse } from '../../shared/types'
import { CACHE_TTL } from '../../lib/config'
import { buildCacheKey, cachedJson } from '../../lib/cache'
import { fetchUpstreamJson } from '../../lib/upstream'
import { normalizeTrending } from '../../lib/transformers'
import { trendingPath } from '../../lib/paths'

export async function getTrending(): Promise<TrendingResponse> {
  const cacheKey = buildCacheKey('trending', [])
  return cachedJson(
    cacheKey,
    CACHE_TTL.trending,
    async () => normalizeTrending(await fetchUpstreamJson(trendingPath())),
  )
}
