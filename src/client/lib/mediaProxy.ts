/** Client-side helper to route media through the Worker proxy. */
import { mediaProxyPath } from '@shared/mediaProxyPath'
import { getMediaProxyEnabled } from '@/lib/settings'

export { mediaProxyPath }

function rewriteToProxy(url: string): string {
  if (url.startsWith('/api/media-proxy') || url.includes('/api/media-proxy?')) {
    return url
  }
  try {
    const abs = new URL(url, window.location.href)
    if (abs.protocol !== 'https:') return url
    return mediaProxyPath(abs.toString())
  } catch {
    return url
  }
}

/**
 * Rewrite a video/audio URL to go through `/api/media-proxy`, unless the
 * user has disabled the media proxy in Settings (default: disabled), in
 * which case the original URL is returned unchanged.
 *
 * Pass `force: true` to always proxy regardless of the Settings toggle —
 * used for HLS playback (see `toProxiedHlsUrl`), since HLS manifests/segments
 * must always go through the Worker proxy (CORS / referrer / IP-locked
 * signatures block direct googlevideo requests for HLS).
 */
export function toProxiedMediaUrl(url: string, options?: { force?: boolean }): string {
  if (!options?.force && !getMediaProxyEnabled()) {
    return url
  }
  return rewriteToProxy(url)
}

/**
 * Rewrite an HLS manifest/segment URL to go through `/api/media-proxy`,
 * always — independent of the user's media-proxy Settings toggle. HLS
 * playback (both hls.js and native Safari HLS) requires the proxy to
 * rewrite manifests and serve segments from the same origin.
 */
export function toProxiedHlsUrl(url: string): string {
  return toProxiedMediaUrl(url, { force: true })
}

/**
 * Rewrite an image URL to go through `/api/media-proxy`. Images are always
 * proxied regardless of the video/audio media-proxy setting — this toggle
 * only governs playback (video/audio), not thumbnails/avatars.
 */
export function toProxiedImageUrl(url: string): string {
  return rewriteToProxy(url)
}
