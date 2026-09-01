/** Hard cap on cache key length to avoid pathological keys from long continuations. */
const MAX_CACHE_KEY_LENGTH = 2048

/**
 * Build a stable cache key from a prefix and parts.
 * Parts are URI-encoded; undefined becomes `_`.
 * Oversized keys are truncated with a length marker so callers never crash.
 */
export function buildCacheKey(prefix: string, parts: Array<string | number | undefined>): string {
  const key = [prefix, ...parts.map((p) => (p === undefined ? '_' : encodeURIComponent(String(p))))].join(
    ':',
  )
  if (key.length <= MAX_CACHE_KEY_LENGTH) return key
  // Deterministic truncation: keep head + length so distinct long keys still differ.
  const head = key.slice(0, MAX_CACHE_KEY_LENGTH - 24)
  return `${head}#len=${key.length}`
}
