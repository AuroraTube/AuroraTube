import type { SearchResults, SearchType } from '../../shared/types'
import { CACHE_TTL } from '../../lib/config'
import { buildCacheKey, cachedJson } from '../../lib/cache'
import { fetchUpstreamJson } from '../../lib/upstream'
import { normalizeSearchResults } from '../../lib/transformers'
import { searchPath } from '../../lib/paths'

export async function getSearchResults(
  query: string,
  type: SearchType,
  page: number,
): Promise<SearchResults> {
  const cacheKey = buildCacheKey('search', [query, type, page])
  return cachedJson(
    cacheKey,
    CACHE_TTL.search,
    async () => normalizeSearchResults(await fetchUpstreamJson(searchPath(query, type, page))),
  )
}
