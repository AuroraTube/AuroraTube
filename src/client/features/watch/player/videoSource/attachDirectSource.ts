import type { ResumeController } from './resumePlayback'

const MAX_DIRECT_RETRIES = 3
const DIRECT_RETRY_BASE_DELAY_MS = 600

type Options = {
  video: HTMLVideoElement
  /** Already-proxied source URL (progressive media or a native-HLS playlist). */
  src: string
  resume: ResumeController
  onFatalError: () => void
}

/**
 * Attach a source directly to `video.src` — used for progressive (non-HLS)
 * media and for Safari's native HLS playback, neither of which get hls.js's
 * built-in recovery. A single transient hiccup (cold-start proxy request,
 * a momentary upstream 502, a race during element re-attachment) previously
 * surfaced immediately as the "reload" overlay. Retry a few times with
 * backoff before giving up, matching the leniency hls.js already gets for
 * network errors.
 *
 * Returns a cleanup function that unbinds listeners and cancels any pending
 * retry.
 */
export function attachDirectSource({ video, src, resume, onFatalError }: Options): () => void {
  let cancelled = false
  let retryCount = 0
  let retryTimer: ReturnType<typeof setTimeout> | undefined

  const clearRetryTimer = () => {
    if (retryTimer != null) {
      clearTimeout(retryTimer)
      retryTimer = undefined
    }
  }

  const onError = () => {
    if (cancelled) return
    const code = video.error?.code
    console.error('Video element failed to load', video.error)

    const isRetryable =
      code === MediaError.MEDIA_ERR_NETWORK || code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED

    if (isRetryable && retryCount < MAX_DIRECT_RETRIES) {
      retryCount += 1
      retryTimer = setTimeout(
        () => {
          if (cancelled) return
          try {
            video.load()
          } catch {
            /* ignore */
          }
        },
        DIRECT_RETRY_BASE_DELAY_MS * retryCount,
      )
      return
    }

    onFatalError()
  }

  video.addEventListener('error', onError)
  video.src = src
  video.load()
  resume.bindOnce()

  return () => {
    cancelled = true
    clearRetryTimer()
    video.removeEventListener('error', onError)
  }
}
