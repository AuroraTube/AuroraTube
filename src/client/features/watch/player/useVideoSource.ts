import { useEffect, useRef, type RefObject } from 'react'
import Hls from 'hls.js'
import { toProxiedMediaUrl } from '@/lib/mediaProxy'

type Options = {
  videoRef: RefObject<HTMLVideoElement | null>
  url: string | undefined
  isHls: boolean
  resume?: { time: number; play: boolean; rate: number }
}

function destroyHls(ref: { current: Hls | null }): void {
  if (!ref.current) return
  try {
    ref.current.destroy()
  } catch {
    /* ignore */
  }
  ref.current = null
}

/**
 * Attach progressive src or HLS (hls.js / native Safari).
 * HLS manifests and segments are loaded through `/api/media-proxy`.
 * Progressive split A/V still uses direct googlevideo URLs.
 * Starts loading immediately and attempts autoplay when the media is ready
 * (browser autoplay policy may still require a user gesture).
 */
export function useVideoSource({ videoRef, url, isHls, resume }: Options): void {
  const hlsRef = useRef<Hls | null>(null)
  const resumeRef = useRef(resume)
  resumeRef.current = resume

  useEffect(() => {
    const video = videoRef.current
    if (!video || !url) return

    let cancelled = false
    let resumeApplied = false
    destroyHls(hlsRef)

    video.removeAttribute('src')
    video.removeAttribute('crossOrigin')
    video.preload = 'auto'

    const snap = resumeRef.current
    const shouldAutoplay = snap?.play !== false

    const applyResumeAndPlay = () => {
      if (cancelled || resumeApplied) return
      resumeApplied = true
      if (snap && snap.time > 0 && Number.isFinite(snap.time)) {
        try {
          video.currentTime = snap.time
        } catch {
          /* ignore */
        }
      }
      if (snap?.rate) video.playbackRate = snap.rate
      if (shouldAutoplay) {
        void video.play().catch(() => {
          /* Autoplay may be blocked; user can tap play. */
        })
      }
    }

    const bindResumeOnce = () => {
      video.addEventListener('loadedmetadata', applyResumeAndPlay, { once: true })
      video.addEventListener('canplay', applyResumeAndPlay, { once: true })
    }

    const unbindResume = () => {
      video.removeEventListener('loadedmetadata', applyResumeAndPlay)
      video.removeEventListener('canplay', applyResumeAndPlay)
    }

    const teardownMedia = () => {
      cancelled = true
      unbindResume()
      destroyHls(hlsRef)
      video.removeAttribute('src')
      try {
        video.load()
      } catch {
        /* ignore */
      }
    }

    if (isHls) {
      const proxiedUrl = toProxiedMediaUrl(url)

      const preferNative =
        !Hls.isSupported() && Boolean(video.canPlayType('application/vnd.apple.mpegurl'))

      if (preferNative) {
        // Native HLS: proxy rewrites m3u8 body so segments stay on /api/media-proxy.
        video.src = proxiedUrl
        video.load()
        bindResumeOnce()
        return teardownMedia
      }

      if (!Hls.isSupported()) {
        console.error('HLS is not supported in this browser')
        return teardownMedia
      }

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
          // Route every playlist / segment request through the Worker proxy.
          // When the playlist was already rewritten by the proxy, requestUrl is
          // already /api/media-proxy?... and toProxiedMediaUrl is a no-op.
          const proxied = toProxiedMediaUrl(requestUrl)
          if (proxied !== requestUrl) {
            xhr.open('GET', proxied, true)
          }
        },
      })
      hlsRef.current = hls

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (cancelled || !data.fatal) return
        console.error('HLS fatal error', data.type, data.details)
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad()
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError()
        } else {
          destroyHls(hlsRef)
        }
      })

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        applyResumeAndPlay()
      })

      hls.loadSource(proxiedUrl)
      hls.attachMedia(video)

      return teardownMedia
    }

    video.src = url
    video.load()
    bindResumeOnce()
    return teardownMedia
  }, [videoRef, url, isHls])
}
