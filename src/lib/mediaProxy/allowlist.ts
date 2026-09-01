import { isBlockedHostname } from '../net/hosts'
import { isAllowedMediaHostname, isInvidiousHostname } from '../net/mediaHosts'

/**
 * Proxy target validation for captions (timedtext) and HLS / progressive media.
 * Stricter than stream URL resolution: only CDN hosts + playback paths on youtube.com
 * and caption endpoints on configured Invidious instances.
 */

const MAX_URL_LENGTH = 8_192
const MAX_PATH_LENGTH = 4096

function isYoutubeHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com')
}

function isTimedtextPath(url: URL): boolean {
  const hay = `${url.pathname}?${url.search}`
  return /timedtext/i.test(hay) || /\/api\/timedtext/i.test(url.pathname)
}

/** Invidious GET /api/v1/captions/:id (official captions proxy path). */
function isInvidiousCaptionPath(url: URL): boolean {
  return /^\/api\/v1\/captions\//i.test(url.pathname)
}

/**
 * Restrict youtube.com / youtu.be to playback-related paths.
 * Prevents open proxying of arbitrary YouTube HTML pages.
 */
function isYoutubeMediaPath(url: URL): boolean {
  const path = url.pathname.toLowerCase()
  if (isTimedtextPath(url)) return true
  if (path.includes('/videoplayback')) return true
  if (path.includes('/api/manifest')) return true
  if (path.includes('/manifest/')) return true
  if (/\.m3u8$/i.test(path)) return true
  if (/\.(ts|m4s|mp4|webm)$/i.test(path)) return true
  return false
}

function parseBase(raw: string | null): URL {
  if (!raw) throw new Error('Missing url')
  if (raw.length > MAX_URL_LENGTH) throw new Error('URL too long')
  if (/[\u0000-\u001f\u007f]/.test(raw)) throw new Error('Invalid url')

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error('Invalid url')
  }

  if (url.protocol !== 'https:') throw new Error('Only HTTPS is allowed')
  if (url.username || url.password) throw new Error('Credentials in URL are not allowed')
  if (url.port && url.port !== '443') throw new Error('Non-standard port is not allowed')
  if (isBlockedHostname(url.hostname)) throw new Error('Host not allowed')
  if (url.pathname.length > MAX_PATH_LENGTH) throw new Error('Path too long')
  return url
}

export function parseCaptionProxyTarget(raw: string | null): URL {
  const url = parseBase(raw)
  if (isYoutubeHost(url.hostname) && isTimedtextPath(url)) return url
  if (isInvidiousHostname(url.hostname) && isInvidiousCaptionPath(url)) return url
  throw new Error('Host or path not allowed')
}

export function parseMediaProxyTarget(raw: string | null): URL {
  const url = parseBase(raw)
  if (!isAllowedMediaHostname(url.hostname)) throw new Error('Host not allowed')
  if (isYoutubeHost(url.hostname) && !isYoutubeMediaPath(url)) {
    throw new Error('Path not allowed')
  }
  return url
}

/**
 * Classify a proxy URL as caption or media.
 * Caption rules are tried first (stricter path allowlist).
 */
export function parseProxyTarget(raw: string | null): { kind: 'caption' | 'media'; url: URL } {
  try {
    return { kind: 'caption', url: parseCaptionProxyTarget(raw) }
  } catch {
    /* fall through to media */
  }
  return { kind: 'media', url: parseMediaProxyTarget(raw) }
}

export function isProxyableMediaUrl(url: string): boolean {
  try {
    parseMediaProxyTarget(url)
    return true
  } catch {
    return false
  }
}
