/** Shared network limits for upstream JSON and same-origin guarded fetches. */
export const UPSTREAM_MAX_REDIRECTS = 5 as const

/** Media / caption / image proxy redirect budget (may cross origin via allowlists). */
export const PROXY_MAX_REDIRECTS = 5 as const
