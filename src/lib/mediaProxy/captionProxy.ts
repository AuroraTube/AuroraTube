import { upstreamUnavailable } from '../errors'
import { fetchCaption, MAX_CAPTION_BYTES } from './fetchCaption'
import { mediaProxyHeaders } from './headers'
import { isCaptionContentType } from './contentType'

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
