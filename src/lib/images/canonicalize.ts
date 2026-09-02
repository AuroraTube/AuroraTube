/**
 * Canonicalize image URLs for embed: https only, unwrap Invidious proxies onto CDNs.
 */
import { unwrapInvidiousImageUrl } from '../urls/unwrap'

/**
 * - protocol-relative // → https:
 * - http:// → https://
 * - Invidious /vi /ggpht proxies → Google CDNs
 * Returns null when empty.
 */
export function canonicalizeImageUrl(url: string): string | null {
  let u = url.trim()
  if (!u || u.startsWith('data:') || u.startsWith('blob:')) return u || null
  if (u.startsWith('//')) u = `https:${u}`
  else if (u.startsWith('http://')) u = `https://${u.slice('http://'.length)}`
  if (!/^https:\/\//i.test(u)) return null
  return unwrapInvidiousImageUrl(u, 'https://i.ytimg.com')
}
