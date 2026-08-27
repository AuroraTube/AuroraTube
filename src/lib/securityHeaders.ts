/**
 * Baseline response headers for every Worker response.
 * CSP is defined once here and reused by the SPA HTML path.
 */

/**
 * CSP tuned for this SPA + media-proxy architecture:
 * - Scripts/styles from self (Vite build); wasm for any future codec helpers
 * - Images: data URIs (API embeds) + YouTube image CDNs only
 * - Media/connect: googlevideo / youtube / siatube + same-origin proxy + blob (hls.js)
 * - Workers/blob for hls.js MSE
 * - frame-ancestors none
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.ytimg.com https://*.ggpht.com https://*.googleusercontent.com https://i.ytimg.com https://yt3.ggpht.com",
  "media-src 'self' blob: https://*.googlevideo.com https://*.youtube.com https://*.siatube.com",
  "connect-src 'self' blob: https://*.googlevideo.com https://*.youtube.com https://*.siatube.com",
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
