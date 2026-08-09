import type { Context } from 'hono'
import { CONTENT_SECURITY_POLICY, SECURITY_HEADERS } from '../lib/securityHeaders'

const HTML_HEADERS: Record<string, string> = {
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'no-cache',
  ...SECURITY_HEADERS,
  // Explicit so HTML always gets the same CSP as API (SECURITY_HEADERS already includes it)
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
}

/** Serve the Vite-built SPA (ASSETS binding) with HTML fallback. */
export async function serveSpa(c: Context<{ Bindings: Env }>): Promise<Response> {
  const assets = c.env.ASSETS
  if (!assets) {
    return c.text('Assets binding not configured', 500)
  }

  const url = new URL(c.req.url)
  const assetResponse = await assets.fetch(c.req.raw)
  if (assetResponse.status !== 404) {
    const headers = new Headers(assetResponse.headers)
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      headers.set(key, value)
    }
    return new Response(assetResponse.body, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers,
    })
  }

  const index = await assets.fetch(new Request(new URL('/index.html', url.origin)))
  return new Response(index.body, {
    status: 200,
    headers: HTML_HEADERS,
  })
}
