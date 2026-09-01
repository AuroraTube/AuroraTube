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
 */
export function toProxiedMediaUrl(url: string): string {
  if (!getMediaProxyEnabled()) {
    return url
  }
  return rewriteToProxy(url)
}

/**
 * Rewrite an image URL to go through `/api/media-proxy`. Images are always
 * proxied regardless of the video/audio media-proxy setting — this toggle
 * only governs playback (video/audio), not thumbnails/avatars.
 */
export function toProxiedImageUrl(url: string): string {
  return rewriteToProxy(url)
}
