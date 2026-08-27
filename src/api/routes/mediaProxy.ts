import type { Context } from 'hono'
import { badRequest } from '../../lib/errors'
import {
  handleCaptionProxy,
  handleMediaProxy,
  parseProxyTarget,
} from '../../lib/mediaProxy'

/**
 * Unified proxy:
 * - Captions: YouTube timedtext (buffered, size-capped)
 * - Media: HLS playlists + segments (m3u8 rewritten; segments streamed)
 */
export async function mediaProxyHandler(c: Context) {
  const raw = new URL(c.req.url).searchParams.get('url')

  let kind: 'caption' | 'media'
  let target: URL
  try {
    const parsed = parseProxyTarget(raw)
    kind = parsed.kind
    target = parsed.url
  } catch (e) {
    throw badRequest(e instanceof Error ? e.message : 'Invalid proxy url')
  }

  if (kind === 'caption') return handleCaptionProxy(target)
  return handleMediaProxy(c, target)
}
