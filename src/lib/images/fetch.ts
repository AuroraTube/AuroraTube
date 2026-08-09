import { CACHE_TTL, IMAGE_FETCH, INVIDIOUS_INSTANCES } from '../config'
import { buildCacheKey, getCachedJson, setCachedJson } from '../cache'
import { isAllowedImageHost, isYtimgHost } from '../net/hosts'
import { BROWSER_UA } from '../net/userAgent'
import { PROXY_MAX_REDIRECTS } from '../net/constants'
import { followRedirects } from '../net/followRedirects'

const YTIMG_VI_FALLBACKS = [
  'hqdefault.jpg',
  'sddefault.jpg',
  'mqdefault.jpg',
  'hq720.jpg',
  'default.jpg',
] as const

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const Buf = (globalThis as { Buffer?: { from(data: Uint8Array): { toString(enc: string): string } } })
    .Buffer
  if (Buf) return Buf.from(bytes).toString('base64')
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function isSafeImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    if (parsed.username || parsed.password) return false
    if (parsed.port && parsed.port !== '443') return false
    return isAllowedImageHost(parsed.hostname, INVIDIOUS_INSTANCES)
  } catch {
    return false
  }
}

function ytimgViFallbacks(url: string): string[] {
  try {
    const parsed = new URL(url)
    if (!isYtimgHost(parsed.hostname)) return []
    const m = parsed.pathname.match(/^\/(vi(?:_webp)?)\/([A-Za-z0-9_-]{6,20})\/([^/?#]+)$/i)
    if (!m) return []
    const [, kind, videoId, file] = m
    const out: string[] = []
    for (const name of YTIMG_VI_FALLBACKS) {
      if (name === file) continue
      const next = new URL(parsed.toString())
      next.pathname = `/${kind}/${videoId}/${name}`
      out.push(next.toString())
    }
    return out
  } catch {
    return []
  }
}

/** ggpht size-token fallbacks (=s48 → =s176 / =s88). */
function ggphtSizeFallbacks(url: string): string[] {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    if (!host.endsWith('ggpht.com') && !host.endsWith('googleusercontent.com')) return []
    const hay = parsed.pathname + parsed.search
    if (!/=s\d+/i.test(hay)) return []
    const out: string[] = []
    for (const size of ['s176', 's88']) {
      const next = url.replace(/=s\d+/i, `=${size}`)
      if (next !== url) out.push(next)
    }
    return out
  } catch {
    return []
  }
}

async function fetchOnce(
  url: string,
  signal: AbortSignal,
): Promise<Response | null> {
  try {
    const { response } = await followRedirects({
      url,
      timeoutMs: IMAGE_FETCH.timeoutMs,
      maxRedirects: PROXY_MAX_REDIRECTS,
      sameOriginOnly: false,
      validate: (candidate) => {
        if (!isSafeImageUrl(candidate)) throw new Error('Host not allowed')
        return candidate
      },
      init: {
        signal,
        headers: {
          accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'user-agent': BROWSER_UA,
        },
      },
    })
    return response
  } catch {
    return null
  }
}

/**
 * Fetch image as data URI. Manual redirects; allowlisted hosts only.
 * Tries ytimg quality and ggpht size fallbacks when the primary URL fails.
 */
export async function fetchAsDataUri(url: string): Promise<string | null> {
  if (!url || url.startsWith('data:')) return url || null
  if (!isSafeImageUrl(url)) return null

  const key = buildCacheKey('img', [url])
  const cached = await getCachedJson<string>(key, CACHE_TTL.image)
  if (cached) return cached

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort('timeout'), IMAGE_FETCH.timeoutMs)

  try {
    const candidates = [url, ...ytimgViFallbacks(url), ...ggphtSizeFallbacks(url)]
    let lastOk: { buffer: ArrayBuffer; contentType: string } | null = null

    for (const candidate of candidates) {
      if (controller.signal.aborted) break
      try {
        const response = await fetchOnce(candidate, controller.signal)
        if (!response || !response.ok) continue

        const contentType = (response.headers.get('content-type') ?? 'image/jpeg')
          .split(';')[0]
          .trim()
        if (!contentType.startsWith('image/') && contentType !== 'application/octet-stream') {
          continue
        }

        const buffer = await response.arrayBuffer()
        if (!buffer.byteLength || buffer.byteLength > IMAGE_FETCH.maxBytes) continue
        if (buffer.byteLength < 500 && candidates.length > 1 && candidate === url) continue

        lastOk = { buffer, contentType }
        break
      } catch {
        continue
      }
    }

    if (!lastOk) return null

    const mime = lastOk.contentType.startsWith('image/') ? lastOk.contentType : 'image/jpeg'
    const dataUri = `data:${mime};base64,${toBase64(lastOk.buffer)}`
    await setCachedJson(key, dataUri, CACHE_TTL.image)
    return dataUri
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
