import type { Context } from 'hono'
import { upstreamUnavailable } from '../errors'
import { fetchMedia } from './fetchMedia'
import { mediaProxyHeaders } from './headers'
import { sanitizeRangeHeader } from './range'
import { isSafeMediaContentType } from './contentType'
import { buildPlaylistResponse, isPlaylistResponse } from './playlistResponse'
import { buildSegmentResponse } from './segmentResponse'

export { handleCaptionProxy } from './captionProxy'

/**
 * Media path: fetch the validated target, reject unsafe content types, and
 * dispatch to the HLS-playlist rewriter or the plain segment passthrough.
 */
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
  if (isPlaylistResponse(contentType, playlistUrl)) {
    return buildPlaylistResponse(upstream, contentType, playlistUrl)
  }

  return buildSegmentResponse(upstream, contentType)
}
