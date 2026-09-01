/**
 * Baseline response headers for every Worker response.
 * CSP is defined once here and reused by the SPA HTML path.
 */
import { INVIDIOUS_INSTANCES } from './config'

/**
 * Origins that video/audio/caption playback may hit directly.
 *
 * Most of the time these are fetched through the same-origin
 * `/api/media-proxy` (see src/lib/mediaProxy), which is why `'self'` and
 * `blob:` cover the common case. However the media-proxy toggle in Settings
 * (see src/client/lib/settings.ts, default OFF) lets the client fetch
 * video/audio directly from the upstream CDN instead of proxying it. When
 * that happens the browser's `<video>`/`<audio>` element and hls.js load
 * bytes straight from these third-party hosts, so they must be allowlisted
 * here too or playback silently breaks under CSP. Keep this in sync with
 * the server-side allowlist in `lib/net/mediaHosts.ts`.
 */
const DIRECT_MEDIA_ORIGINS = [
  'https://*.googlevideo.com',
  'https://*.youtube.com',
  'https://youtube.com',
  'https://youtu.be',
  'https://*.ytimg.com',
  'https://*.ggpht.com',
  'https://*.googleusercontent.com',
  'https://siatube.com',
  'https://*.siatube.com',
  ...INVIDIOUS_INSTANCES,
]

/**
 * CSP tuned for this SPA + media-proxy architecture.
 * `img-src` allows `data:` because some upstreams (e.g. the Sia API) return
 * thumbnails as base64 data URLs instead of fetchable URLs; those are never
 * proxied (see collectRefs) and are rendered directly.
 * `media-src`/`connect-src` allow the direct-media origins above because the
 * media-proxy toggle can route playback straight to the upstream CDN.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  `media-src 'self' blob: ${DIRECT_MEDIA_ORIGINS.join(' ')}`,
  `connect-src 'self' blob: ${DIRECT_MEDIA_ORIGINS.join(' ')}`,
  "worker-src 'self' blob:",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ')

export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
}

export function applySecurityHeaders(headers: Headers): void {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(key)) headers.set(key, value)
  }
}
