import { isAllowedMediaHostname } from '../net/mediaHosts'
import { asString, type RecordLike } from '../parse'

const MAX_URL_LENGTH = 8_192

/**
 * Only allow https media URLs without credentials or non-standard ports
 * on known media CDNs (blocks javascript:, data:, http:, userinfo, private hosts).
 */
export function isSafeMediaUrl(url: string): boolean {
  if (!url || url.length > MAX_URL_LENGTH) return false
  if (/[\u0000-\u001f\u007f]/.test(url)) return false
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    if (parsed.username || parsed.password) return false
    if (parsed.port && parsed.port !== '443') return false
    if (!isAllowedMediaHostname(parsed.hostname)) return false
    return true
  } catch {
    return false
  }
}

export function looksLikeHls(item: RecordLike, url: string): boolean {
  if (item.isM3u8 === true) return true
  const ext = asString(item.ext)?.toLowerCase()
  if (ext === 'm3u8') return true
  const protocol = asString(item.protocol)?.toLowerCase() ?? ''
  if (protocol.includes('m3u8') || protocol.includes('hls')) return true
  const media = asString(item.mediaType)?.toLowerCase() ?? ''
  if (media === 'hls' || media === 'm3u8') return true
  if (/\.m3u8(\?|#|$)/i.test(url)) return true
  if (/\/manifest\/hls_/i.test(url)) return true
  return false
}

export function isHlsVariantUrl(url: string): boolean {
  return /\/manifest\/hls_variant\//i.test(url)
}
