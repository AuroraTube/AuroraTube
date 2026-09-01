/**
 * Build the same-origin media-proxy path for a given upstream URL.
 * Used by both the Worker (server-side payload rewriting) and the SPA
 * (client-side <img>/<video> src rewriting) — kept in one place so the
 * two never drift apart.
 */
export function mediaProxyPath(url: string): string {
  return `/api/media-proxy?url=${encodeURIComponent(url)}`
}
