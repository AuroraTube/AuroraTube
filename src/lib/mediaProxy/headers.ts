/**
 * CORS + safety headers for `/api/media-proxy` responses.
 * Intentionally omits CSP / frame-ancestors (HTML page concerns) so media
 * responses stay lean; CORP + nosniff remain for isolation.
 */

const MEDIA_PROXY_BASE: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Resource-Policy': 'cross-origin',
}

export function mediaProxyHeaders(extra?: Record<string, string>): Headers {
  const headers = new Headers(MEDIA_PROXY_BASE)
  if (extra) {
    for (const [k, v] of Object.entries(extra)) headers.set(k, v)
  }
  return headers
}
