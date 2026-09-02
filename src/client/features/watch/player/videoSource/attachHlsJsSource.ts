import Hls from 'hls.js'
import { toProxiedHlsUrl } from '@/lib/mediaProxy'
import type { ResumeController } from './resumePlayback'

const MAX_NETWORK_RETRIES = 3

type Options = {
  video: HTMLVideoElement
  /** Already-proxied manifest URL. */
  src: string
  resume: ResumeController
  onFatalError: () => void
}

/**
 * Attach an hls.js instance for adaptive HLS playback. hls.js owns its own
 * network-error recovery (retried via `startLoad`) and media-error recovery
 * (`recoverMediaError`), so the native `<video>` "error" event is not used
 * here — only truly unrecoverable errors surface as a fatal error.
 *
 * Returns a cleanup function that destroys the hls.js instance.
 */
export function attachHlsJsSource({ video, src, resume, onFatalError }: Options): () => void {
  let cancelled = false
  let networkRetryCount = 0

  const hls = new Hls({
    enableWorker: true,
    lowLatencyMode: false,
    backBufferLength: 90,
    maxBufferLength: 60,
    autoStartLoad: true,
    startLevel: -1,
    xhrSetup: (xhr, requestUrl) => {
      try {
        xhr.withCredentials = false
      } catch {
        /* ignore */
      }
      // Route every playlist / segment request through the Worker proxy,
      // always — HLS ignores the media-proxy Settings toggle. When the
      // playlist was already rewritten by the proxy, requestUrl is already
      // /api/media-proxy?... and toProxiedHlsUrl is a no-op.
      const proxied = toProxiedHlsUrl(requestUrl)
      if (proxied !== requestUrl) {
        xhr.open('GET', proxied, true)
      }
    },
  })

  hls.on(Hls.Events.ERROR, (_event, data) => {
    if (cancelled || !data.fatal) return
    console.error('HLS fatal error', data.type, data.details)
    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
      networkRetryCount += 1
      if (networkRetryCount > MAX_NETWORK_RETRIES) {
        hls.destroy()
        onFatalError()
        return
      }
      hls.startLoad()
    } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
      hls.recoverMediaError()
    } else {
      hls.destroy()
      onFatalError()
    }
  })

  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    resume.apply()
  })

  hls.loadSource(src)
  hls.attachMedia(video)

  return () => {
    cancelled = true
    hls.destroy()
  }
}
