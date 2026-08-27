/**
 * Follow HTTPS redirects on stream media URLs without downloading bodies.
 */
import { youtubeMediaHeaders } from '../net/youtubeHeaders'
import { mapPool } from '../util/mapPool'
import type { QualityOption, StreamEntry, StreamPayload } from '../../shared/types'
import { isSafeMediaUrl } from './url'

const MAX_REDIRECTS = 8
const FETCH_TIMEOUT_MS = 12_000
const RESOLVE_CONCURRENCY = 6

type ProbeResult =
  | { kind: 'redirect'; url: string }
  | { kind: 'terminal' }
  | { kind: 'error' }

/**
 * Resolve a single media URL to its final HTTPS location.
 * On failure, returns the original URL so the client can still attempt playback.
 */
async function resolveMediaRedirect(url: string): Promise<string> {
  if (!isSafeMediaUrl(url)) return url

  let current = url
  const seen = new Set<string>([url])

  for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
    if (!isSafeMediaUrl(current)) return url

    const next = await probeRedirect(current)
    if (next === null) {
      return isSafeMediaUrl(current) ? current : url
    }
    if (next === current || seen.has(next)) {
      return isSafeMediaUrl(current) ? current : url
    }
    seen.add(next)
    current = next
  }

  return isSafeMediaUrl(current) ? current : url
}

/**
 * HEAD first; on method-not-allowed / network error, try GET Range 0-0.
 * Returns next URL, or null when current is terminal / unresolvable.
 */
async function probeRedirect(url: string): Promise<string | null> {
  const head = await probeOnce(url, 'HEAD')
  if (head.kind === 'redirect') return head.url
  if (head.kind === 'terminal') return null

  const get = await probeOnce(url, 'GET')
  if (get.kind === 'redirect') return get.url
  return null
}

async function probeOnce(url: string, method: 'HEAD' | 'GET'): Promise<ProbeResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort('timeout'), FETCH_TIMEOUT_MS)

  try {
    const headers = youtubeMediaHeaders(method === 'GET' ? { Range: 'bytes=0-0' } : undefined)

    const res = await fetch(url, {
      method,
      headers,
      redirect: 'manual',
      signal: controller.signal,
    })

    if (method === 'GET' && res.body) {
      try {
        await res.body.cancel()
      } catch {
        /* ignore */
      }
    }

    // Method not supported — try the other probe strategy.
    if (res.status === 405 || res.status === 501) return { kind: 'error' }

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')?.trim()
      if (!loc) return { kind: 'error' }
      try {
        const absolute = new URL(loc, url).toString()
        if (!isSafeMediaUrl(absolute)) return { kind: 'error' }
        return { kind: 'redirect', url: absolute }
      } catch {
        return { kind: 'error' }
      }
    }

    return { kind: 'terminal' }
  } catch {
    return { kind: 'error' }
  } finally {
    clearTimeout(timer)
  }
}

function rewriteEntry(entry: StreamEntry, resolved: Map<string, string>): StreamEntry {
  const next = resolved.get(entry.url)
  if (!next || next === entry.url) return entry
  return { ...entry, url: next }
}

function rewriteQuality(q: QualityOption, resolved: Map<string, string>): QualityOption {
  return {
    ...q,
    video: rewriteEntry(q.video, resolved),
    audio: q.audio ? rewriteEntry(q.audio, resolved) : undefined,
  }
}

function collectStreamUrls(payload: StreamPayload): string[] {
  const urls = new Set<string>()
  for (const q of payload.qualities) {
    if (q.video?.url) urls.add(q.video.url)
    if (q.audio?.url) urls.add(q.audio.url)
  }
  return [...urls]
}

/** Resolve all video/audio URLs in a stream payload to final redirect targets. */
export async function resolvePayloadRedirects(payload: StreamPayload): Promise<StreamPayload> {
  const urls = collectStreamUrls(payload)
  if (!urls.length) return payload

  const finals = await mapPool(urls, RESOLVE_CONCURRENCY, resolveMediaRedirect)
  const resolved = new Map<string, string>()
  urls.forEach((u, i) => {
    const f = finals[i]
    if (f && f !== u) resolved.set(u, f)
  })

  if (!resolved.size) return payload

  return {
    ...payload,
    qualities: payload.qualities.map((q) => rewriteQuality(q, resolved)),
  }
}
