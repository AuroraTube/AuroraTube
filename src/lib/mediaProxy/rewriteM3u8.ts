import { isProxyableMediaUrl } from './allowlist'
import { mediaProxyPath } from './path'

/**
 * Rewrite URI references inside an HLS playlist so subsequent segment /
 * variant requests go through `/api/media-proxy`.
 * Only rewrites URLs that pass the media proxy allowlist.
 */
export function rewriteM3u8(body: string, playlistUrl: string): string {
  let base: URL
  try {
    base = new URL(playlistUrl)
  } catch {
    return body
  }

  const proxy = (raw: string): string => {
    const trimmed = raw.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('data:')) return raw
    try {
      const abs = new URL(trimmed, base).toString()
      if (!isProxyableMediaUrl(abs)) return trimmed
      return mediaProxyPath(abs)
    } catch {
      return raw
    }
  }

  return body
    .split(/\r?\n/)
    .map((line) => {
      const t = line.trim()
      if (!t) return line

      if (/URI\s*=/i.test(t)) {
        return line.replace(/URI\s*=\s*(["'])([^"']+)\1/gi, (_m, q, uri) => {
          return `URI=${q}${proxy(uri)}${q}`
        })
      }

      if (t.startsWith('#')) return line
      return proxy(t)
    })
    .join('\n')
}

export function isM3u8ContentType(contentType: string | null): boolean {
  if (!contentType) return false
  const ct = contentType.toLowerCase()
  return (
    ct.includes('application/vnd.apple.mpegurl') ||
    ct.includes('application/x-mpegurl') ||
    ct.includes('audio/mpegurl') ||
    ct.includes('audio/x-mpegurl') ||
    ct.includes('mpegurl')
  )
}

export function looksLikeM3u8Body(text: string): boolean {
  const head = text.slice(0, 64).trimStart()
  return head.startsWith('#EXTM3U')
}

/** Reject oversized playlists before buffering into Worker memory. */
export const MAX_PLAYLIST_BYTES = 2_000_000
