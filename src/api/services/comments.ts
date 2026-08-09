import type { CommentSort, CommentsResponse } from '../../shared/types'
import { CACHE_TTL } from '../../lib/config'
import { buildCacheKey, cachedJson } from '../../lib/cache'
import { firstSuccessful } from '../../lib/cascade'
import { commentsPath } from '../../lib/paths'
import { fetchSiaTubeJson, normalizeComments } from '../../lib/siatube'
import { normalizeInvidiousComments } from '../../lib/transformers'
import { fetchUpstreamJson } from '../../lib/upstream'

/**
 * Comments: SiaTube → Invidious.
 * Continuation tokens are provider-specific; each provider is tried with the
 * same opaque token (a foreign token simply fails that provider).
 */
export async function getComments(
  videoId: string,
  sort: CommentSort = 'top',
  continuation?: string,
): Promise<CommentsResponse> {
  const cacheKey = buildCacheKey('comments', [videoId, sort, continuation ?? ''])
  return cachedJson(
    cacheKey,
    CACHE_TTL.comments,
    () =>
      firstSuccessful(
        [
          {
            name: 'siatube',
            run: async () => {
              const params = new URLSearchParams({ videoId, sort })
              if (continuation) params.set('continuation', continuation)
              const raw = await fetchSiaTubeJson(`/api/comments?${params}`)
              return normalizeComments(raw)
            },
          },
          {
            name: 'invidious',
            run: async () => {
              const raw = await fetchUpstreamJson(
                commentsPath(videoId, sort, continuation),
              )
              return normalizeInvidiousComments(raw)
            },
          },
        ],
        'Comments not found',
        { operation: 'comments', id: videoId },
      ),
  )
}
