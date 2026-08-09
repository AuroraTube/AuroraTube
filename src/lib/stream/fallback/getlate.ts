import type { StreamPayload } from '../../../shared/types'
import { GETLATE_STREAM } from '../../config'
import { BROWSER_UA } from '../../net/userAgent'
import { isSafeMediaUrl } from '../url'
import { muxedQualityFromUrl } from './fromUrl'

/**
 * getlate youtube-live-downloader → single 360p muxed StreamPayload.
 *
 * API contract: HTTP 302/303 with stream URL in `Location`.
 * Uses redirect: 'manual' so the Worker does not download video bytes.
 * Further Location hops are resolved later by resolvePayloadRedirects.
 */
export async function fetchGetlateStream(videoId: string): Promise<StreamPayload | null> {
  const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
  const params = new URLSearchParams({
    url: watchUrl,
    formatId: GETLATE_STREAM.formatId,
  })
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort('timeout'), GETLATE_STREAM.timeoutMs)

  try {
    const response = await fetch(`${GETLATE_STREAM.base}?${params}`, {
      signal: controller.signal,
      headers: {
        accept: '*/*',
        'user-agent': BROWSER_UA,
      },
      redirect: 'manual',
    })

    if (!response.ok && response.status !== 302 && response.status !== 303) return null

    const streamUrl = firstLocationUrl(response)
    if (!streamUrl) return null

    const quality = muxedQualityFromUrl({
      url: streamUrl,
      height: 360,
      width: 640,
      formatId: '360p',
      formatNote: '360p',
      ext: 'mp4',
    })
    if (!quality) return null

    return {
      qualities: [quality],
      subtitles: [],
    }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function firstLocationUrl(response: Response): string | undefined {
  const location = response.headers.get('location')?.trim()
  if (!location) return undefined
  try {
    const url = new URL(location, response.url).toString()
    return isSafeMediaUrl(url) ? url : undefined
  } catch {
    return undefined
  }
}
