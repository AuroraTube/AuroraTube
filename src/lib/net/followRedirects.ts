/**
 * Manual redirect following with per-hop URL revalidation.
 * Used by media-proxy, caption proxy, image fetch, and upstream JSON fetches.
 */

export type FollowRedirectsOptions = {
  /** Absolute starting URL. */
  url: string
  init?: RequestInit
  timeoutMs: number
  /** Explicit redirect budget (no silent default). */
  maxRedirects: number
  /**
   * Re-validate every hop (including the first).
   * Must throw on disallowed targets.
   * Return the canonical URL string to fetch next.
   */
  validate: (url: string) => string
  /**
   * When true (default), reject Location that changes origin.
   * Media/caption proxies set this false and rely on `validate` allowlists.
   */
  sameOriginOnly?: boolean
}

export type FollowRedirectsResult = {
  response: Response
  finalUrl: string
}

function combineSignals(
  timeoutMs: number,
  parent?: AbortSignal | null,
): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs)

  if (!parent) {
    return { signal: controller.signal, cancel: () => clearTimeout(timer) }
  }

  if (parent.aborted) {
    controller.abort('parent')
    return { signal: controller.signal, cancel: () => clearTimeout(timer) }
  }

  const onParent = () => controller.abort('parent')
  parent.addEventListener('abort', onParent, { once: true })
  return {
    signal: controller.signal,
    cancel: () => {
      clearTimeout(timer)
      parent.removeEventListener('abort', onParent)
    },
  }
}

/**
 * Fetch with `redirect: 'manual'`, re-validating each Location.
 * Does not consume the response body.
 */
export async function followRedirects(
  options: FollowRedirectsOptions,
): Promise<FollowRedirectsResult> {
  const { maxRedirects, timeoutMs } = options
  const sameOriginOnly = options.sameOriginOnly !== false
  let current = options.validate(options.url)

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const { signal, cancel } = combineSignals(timeoutMs, options.init?.signal)

    try {
      const { signal: _ignored, ...restInit } = options.init ?? {}
      const response = await fetch(current, {
        ...restInit,
        signal,
        redirect: 'manual',
      })

      if (response.status < 300 || response.status >= 400) {
        return { response, finalUrl: current }
      }

      const location = response.headers.get('location')?.trim()
      if (!location) {
        return { response, finalUrl: current }
      }

      let next: URL
      try {
        next = new URL(location, current)
      } catch {
        throw new Error('Invalid redirect location')
      }

      if (sameOriginOnly && next.origin !== new URL(current).origin) {
        throw new Error('Cross-origin redirect rejected')
      }

      current = options.validate(next.toString())
    } finally {
      cancel()
    }
  }

  throw new Error('Too many redirects')
}
