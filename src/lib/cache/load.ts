import { embedImagesSafe } from '../images'
import { getOrSetCachedJson } from './memory'

/**
 * Cache + optional image embed for API service loaders.
 * Keeps services free of repeated getOrSet / embed boilerplate.
 */
export async function cachedJson<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
  options?: { embedImages?: boolean },
): Promise<T> {
  const embed = options?.embedImages !== false
  return getOrSetCachedJson(
    key,
    ttlSeconds,
    async () => {
      const value = await loader()
      return embed ? embedImagesSafe(value) : value
    },
  )
}
