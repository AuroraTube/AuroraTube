import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import Hls from 'hls.js'
import { toProxiedMediaUrl } from '@/lib/mediaProxy'
import { attachDirectSource } from './videoSource/attachDirectSource'
import { attachHlsJsSource } from './videoSource/attachHlsJsSource'
import { createResumeController, type ResumeSnapshot } from './videoSource/resumePlayback'

type Options = {
  videoRef: RefObject<HTMLVideoElement | null>
  url: string | undefined
  isHls: boolean
  resume?: ResumeSnapshot
}

type Result = {
  /** True when the current source failed to load and gave up (no auto-recovery left). */
  error: boolean
  /** Manually re-attach and reload the same source from scratch. */
  reload: () => void
}

/**
 * Attach a video source and keep it in sync with the requested URL/mode.
 *
 * Three playback strategies exist, each delegated to its own module:
 * - `attachHlsJsSource`: adaptive HLS via hls.js, with its own network/media
 *   error recovery.
 * - `attachDirectSource`: everything that sets `video.src` directly —
 *   progressive (non-HLS) media, and Safari's native HLS — with a bounded
 *   retry for transient load errors.
 * - `createResumeController`: shared seek/rate/autoplay restoration used by
 *   both strategies above.
 *
 * All source URLs are routed through `/api/media-proxy` (see toProxiedMediaUrl)
 * rather than fetched directly from the origin CDN — direct googlevideo URLs
 * are frequently rejected by the browser (CORS / referrer / IP-locked
 * signatures) when requested straight from the page origin.
 */
export function useVideoSource({ videoRef, url, isHls, resume }: Options): Result {
  const resumeRef = useRef(resume)
  resumeRef.current = resume
  const [error, setError] = useState(false)
  const [retryToken, setRetryToken] = useState(0)

  const reload = useCallback(() => {
    setError(false)
    setRetryToken((t) => t + 1)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !url) return

    setError(false)
    video.removeAttribute('src')
    video.removeAttribute('crossOrigin')
    video.preload = 'auto'

    const resumeController = createResumeController(video, resumeRef.current)
    const onFatalError = () => setError(true)

    let detach: () => void

    if (isHls) {
      const proxiedUrl = toProxiedMediaUrl(url)
      const preferNative =
        !Hls.isSupported() && Boolean(video.canPlayType('application/vnd.apple.mpegurl'))

      if (preferNative) {
        // Native HLS: proxy rewrites m3u8 body so segments stay on /api/media-proxy.
        detach = attachDirectSource({
          video,
          src: proxiedUrl,
          resume: resumeController,
          onFatalError,
        })
      } else if (Hls.isSupported()) {
        detach = attachHlsJsSource({
          video,
          src: proxiedUrl,
          resume: resumeController,
          onFatalError,
        })
      } else {
        console.error('HLS is not supported in this browser')
        setError(true)
        detach = () => {}
      }
    } else {
      detach = attachDirectSource({
        video,
        src: toProxiedMediaUrl(url),
        resume: resumeController,
        onFatalError,
      })
    }

    return () => {
      resumeController.cancel()
      detach()
      video.removeAttribute('src')
      try {
        video.load()
      } catch {
        /* ignore */
      }
    }
  }, [videoRef, url, isHls, retryToken])

  return { error, reload }
}
