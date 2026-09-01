import { mediaProxyHeaders } from './headers'
import {
  isM3u8ContentType,
  looksLikeM3u8Body,
  MAX_PLAYLIST_BYTES,
  rewriteM3u8,
} from './rewriteM3u8'

/** True when a media response should be treated as an HLS playlist to rewrite. */
export function isPlaylistResponse(contentType: string, url: string): boolean {
  return (
    isM3u8ContentType(contentType) ||
    /\.m3u8(\?|#|$)/i.test(url) ||
    /\/manifest\/hls_/i.test(url)
  )
}

/**
 * Buffer, validate, and rewrite an HLS playlist response so every segment /
 * variant URI routes back through `/api/media-proxy`.
 */
export async function buildPlaylistResponse(
  upstream: Response,
  contentType: string,
  playlistUrl: string,
): Promise<Response> {
  const lenHeader = upstream.headers.get('content-length')
  if (lenHeader && Number(lenHeader) > MAX_PLAYLIST_BYTES) {
    await drain(upstream)
    return new Response('Playlist too large', { status: 502, headers: mediaProxyHeaders() })
  }

  const text = await upstream.text()
  if (text.length > MAX_PLAYLIST_BYTES) {
    return new Response('Playlist too large', { status: 502, headers: mediaProxyHeaders() })
  }

  if (!looksLikeM3u8Body(text) && !isM3u8ContentType(contentType)) {
    return new Response('Not a valid HLS playlist', {
      status: 502,
      headers: mediaProxyHeaders(),
    })
  }

  const rewritten = rewriteM3u8(text, playlistUrl)
  const outType = isM3u8ContentType(contentType) ? contentType : 'application/vnd.apple.mpegurl'
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

async function drain(response: Response): Promise<void> {
  try {
    await response.body?.cancel()
  } catch {
    /* ignore */
  }
}
