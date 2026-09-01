import { mediaProxyHeaders } from './headers'

function forwardHeader(upstream: Headers, name: string, out: Headers): void {
  const v = upstream.get(name)
  if (v) out.set(name, v)
}

/** Stream a progressive media segment through, forwarding range/length headers as-is. */
export function buildSegmentResponse(upstream: Response, contentType: string): Response {
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
