import { UPSTREAM_MAX_REDIRECTS } from './constants'
import { followRedirects, type FollowRedirectsResult } from './followRedirects'

export type FetchJsonOptions = RequestInit & {
  timeoutMs: number
  /** Must be set explicitly (typically {@link UPSTREAM_MAX_REDIRECTS}). */
  maxRedirects: number
}

/**
 * Same-origin, HTTPS-only JSON fetch with manual redirect following.
 * Used by SiaTube metadata/stream and RapidAPI stream.
 * Each hop is re-validated; cross-origin and non-HTTPS targets are rejected.
 */
export async function fetchJsonWithRedirectGuard(
  url: string,
  options: FetchJsonOptions,
): Promise<FollowRedirectsResult> {
  const { timeoutMs, maxRedirects, ...init } = options
  const origin = new URL(url).origin

  return followRedirects({
    url,
    timeoutMs,
    maxRedirects,
    sameOriginOnly: true,
    validate: (candidate) => {
      const parsed = new URL(candidate)
      if (parsed.origin !== origin) {
        throw new Error('Cross-origin redirect rejected')
      }
      if (parsed.protocol !== 'https:') {
        throw new Error('Only HTTPS is allowed')
      }
      return parsed.toString()
    },
    init,
  })
}

export { UPSTREAM_MAX_REDIRECTS }
