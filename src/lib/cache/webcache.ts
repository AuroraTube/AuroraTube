import { logError } from '../log'

/** Cloudflare Workers Cache API helpers (best-effort). */

function hasCaches(): boolean {
  return typeof caches !== 'undefined'
}

function cacheRequest(key: string): Request {
  return new Request(`https://auroratube.local/cache/${encodeURIComponent(key)}`)
}

/** Workers expose caches.default; standard CacheStorage does not. */
function defaultCache(): Cache | null {
  if (!hasCaches()) return null
  const store = caches as CacheStorage & { default?: Cache }
  return store.default ?? null
}

export async function matchWebCache(key: string): Promise<Response | undefined> {
  const cache = defaultCache()
  if (!cache) return undefined
  try {
    return (await cache.match(cacheRequest(key))) ?? undefined
  } catch {
    return undefined
  }
}

export async function putWebCache(
  key: string,
  body: string,
  ttlSeconds: number,
): Promise<void> {
  const cache = defaultCache()
  if (!cache) return
  try {
    await cache.put(
      cacheRequest(key),
      new Response(body, {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': `public, max-age=${ttlSeconds}`,
        },
      }),
    )
  } catch (error) {
    // Cache API entries have a size limit; large payloads can exceed it.
    logError('cache.put_failed', { key, ...((error instanceof Error) ? { errorMessage: error.message } : {}) })
  }
}

