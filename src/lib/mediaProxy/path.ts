/** Relative path used in stream payload subtitle URLs. */

export function mediaProxyPath(url: string): string {
  return `/api/media-proxy?url=${encodeURIComponent(url)}`
}
