/**
 * Map Invidious image-proxy paths back to Google CDNs.
 * Worker-side image embed fetches CDNs directly (not via flaky instances).
 */
import { isGoogleImageHost, isYtimgHost } from '../net/hosts'
import { toAbsoluteUrl } from './absolute'

export function unwrapInvidiousImageUrl(url: string, base: string): string {
  try {
    const absolute = toAbsoluteUrl(url, base)
    if (!absolute) return url
    if (absolute.startsWith('data:') || absolute.startsWith('blob:')) return absolute

    const parsed = new URL(absolute)

    if (isYtimgHost(parsed.hostname) || isGoogleImageHost(parsed.hostname)) {
      return parsed.toString()
    }

    const path = parsed.pathname

    if (path.startsWith('/ggpht/')) {
      return `https://yt3.ggpht.com${path.slice('/ggpht'.length)}${parsed.search}`
    }

    const viMatch = path.match(/^\/(vi(?:_webp)?)\/(.+)$/i)
    if (viMatch) {
      return `https://i.ytimg.com/${viMatch[1]}/${viMatch[2]}${parsed.search}`
    }

    const nestedVi = path.match(
      /\/(vi(?:_webp)?)\/([A-Za-z0-9_-]{6,20}\/[^/]+\.(?:jpg|webp|jpeg|png))$/i,
    )
    if (nestedVi) {
      return `https://i.ytimg.com/${nestedVi[1]}/${nestedVi[2]}${parsed.search}`
    }

    const nestedGgpht = path.match(/\/ggpht\/(.+)$/i)
    if (nestedGgpht) {
      return `https://yt3.ggpht.com/${nestedGgpht[1]}${parsed.search}`
    }

    return parsed.toString()
  } catch {
    return url
  }
}
