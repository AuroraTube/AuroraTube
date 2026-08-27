import type { Context } from 'hono'
import { upstreamUnavailable } from '../errors'
import { fetchCaption, MAX_CAPTION_BYTES } from './fetchCaption'
import { fetchMedia } from './fetchMedia'
import { mediaProxyHeaders } from './headers'
import { sanitizeRangeHeader } from './range'
import {
  isM3u8ContentType,
  looksLikeM3u8Body,
  MAX_PLAYLIST_BYTES,
  rewriteM3u8,
} from './rewriteM3u8'
import { isCaptionContentType, isSafeMediaContentType } from './contentType'

function forwardHeader(upstream: Headers, name: string, out: Headers): void {
  const v = upstream.get(name)
  if (v) out.set(name, v)
}

/** Caption path: buffer + size-cap + content-type check. */
export async function handleCaptionProxy(target: URL): Promise<Response> {
  let upstream: Response
  try {
    upstream = await fetchCaption(target)
  } catch {
    throw upstreamUnavailable()
  }

  if (!upstream.ok) {
    return new Response(`Upstream error ${upstream.status}`, {
      status: 502,
      headers: mediaProxyHeaders(),
    })
  }

  const contentType = upstream.headers.get('content-type') ?? 'text/vtt; charset=utf-8'
  if (!isCaptionContentType(contentType)) {
    return new Response('Unexpected content type', {
      status: 502,
      headers: mediaProxyHeaders(),
    })
  }

  const buf = await upstream.arrayBuffer()
  if (buf.byteLength > MAX_CAPTION_BYTES) {
    return new Response('Caption too large', {
      status: 502,
      headers: mediaProxyHeaders(),
    })
  }

  return new Response(buf, {
    status: 200,
    headers: mediaProxyHeaders({
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=300',
      'Content-Length': String(buf.byteLength),
    }),
  })
}

/** Media path: stream segments; rewrite m3u8 playlists through this proxy. */
export async function handleMediaProxy(c: Context, target: URL): Promise<Response> {
  const range = sanitizeRangeHeader(c.req.header('Range'))

  let upstream: Response
  try {
    upstream = await fetchMedia(target, { range })
  } catch {
    throw upstreamUnavailable()
  }

  if (upstream.status >= 400) {
    return new Response(`Upstream error ${upstream.status}`, {
      status: 502,
      headers: mediaProxyHeaders(),
    })
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'
  if (!isSafeMediaContentType(contentType)) {
    // Drain body to avoid leaking connections when rejecting.
    try {
      await upstream.body?.cancel()
    } catch {
      /* ignore */
    }
    return new Response('Unexpected content type', {
      status: 502,
      headers: mediaProxyHeaders(),
    })
  }

  const playlistUrl = target.toString()
  const isPlaylist =
    isM3u8ContentType(contentType) ||
    /\.m3u8(\?|#|$)/i.test(playlistUrl) ||
    /\/manifest\/hls_/i.test(playlistUrl)

  if (isPlaylist) {
    const lenHeader = upstream.headers.get('content-length')
    if (lenHeader && Number(lenHeader) > MAX_PLAYLIST_BYTES) {
      try {
        await upstream.body?.cancel()
      } catch {
        /* ignore */
      }
      return new Response('Playlist too large', {
        status: 502,
        headers: mediaProxyHeaders(),
      })
    }

    const text = await upstream.text()
    if (text.length > MAX_PLAYLIST_BYTES) {
      return new Response('Playlist too large', {
        status: 502,
        headers: mediaProxyHeaders(),
      })
    }

    if (!looksLikeM3u8Body(text) && !isM3u8ContentType(contentType)) {
      return new Response('Not a valid HLS playlist', {
        status: 502,
        headers: mediaProxyHeaders(),
      })
    }

    const rewritten = rewriteM3u8(text, playlistUrl)
    const outType = isM3u8ContentType(contentType)
      ? contentType
      : 'application/vnd.apple.mpegurl'
    const bytes = new TextEncoder().encode(rewritten)

    return new Response(bytes, {
      status: 200,
      headers: mediaProxyHeaders({
        'Content-Type': outType,
        'Cache-Control': 'private, max-age=30',
        'Content-Length': String(bytes.byteLength),
      }),
    })
  }

  const out = mediaProxyHeaders({
    'Content-Type': contentType,
    'Cache-Control': 'private, max-age=120',
  })
  forwardHeader(upstream.headers, 'Content-Length', out)
  forwardHeader(upstream.headers, 'Content-Range', out)
  forwardHeader(upstream.headers, 'Accept-Ranges', out)
  if (!out.has('Accept-Ranges')) out.set('Accept-Ranges', 'bytes')

  return new Response(upstream.body, {
    status: upstream.status,
    headers: out,
  })
}
