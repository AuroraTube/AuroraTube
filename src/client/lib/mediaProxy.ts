/** Client-side helper to route media through the Worker proxy. */

export function mediaProxyPath(url: string): string {
  return `/api/media-proxy?url=${encodeURIComponent(url)}`
}

export function toProxiedMediaUrl(url: string): string {
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
