import { useEffect, type RefObject } from 'react'

const DRIFT_THRESHOLD_SEC = 0.25
const SYNC_INTERVAL_MS = 500

type Options = {
  videoRef: RefObject<HTMLVideoElement | null>
  audioRef: RefObject<HTMLAudioElement | null>
  /** When set, video is muted and this audio track is kept in sync. */
  audioUrl: string | undefined
}

/**
 * Keep a hidden <audio> element aligned with the video clock (split A/V streams).
 * Volume / mute are owned exclusively by `useMediaLevels` — this hook must not
 * overwrite them on `volumechange` (that previously forced unmute).
 */
export function useDualAudioSync({ videoRef, audioRef, audioUrl }: Options): void {
  useEffect(() => {
    const video = videoRef.current
    if (!video || !audioUrl) return

    video.muted = true

    const syncTime = (force = false) => {
      const audio = audioRef.current
      if (!audio) return
      const drift = Math.abs(audio.currentTime - video.currentTime)
      if (!force && drift <= DRIFT_THRESHOLD_SEC) return
      try {
        audio.currentTime = video.currentTime
      } catch {
        /* mid-load seek */
      }
    }

    const onPlay = () => {
      const audio = audioRef.current
      if (!audio) return
      syncTime(true)
      void audio.play().catch(() => undefined)
    }

    const onPause = () => audioRef.current?.pause()
    const onSeek = () => syncTime(true)
    const onRate = () => {
      const audio = audioRef.current
      if (audio) audio.playbackRate = video.playbackRate
    }

    // Ensure video stays muted if the browser UI tries to unmute the video element.
    const onVolume = () => {
      if (!video.muted) video.muted = true
    }

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('seeking', onSeek)
    video.addEventListener('seeked', onSeek)
    video.addEventListener('ratechange', onRate)
    video.addEventListener('volumechange', onVolume)

    const interval = window.setInterval(() => {
      if (!video.paused) syncTime(false)
    }, SYNC_INTERVAL_MS)

    if (!video.paused) onPlay()

    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('seeking', onSeek)
      video.removeEventListener('seeked', onSeek)
      video.removeEventListener('ratechange', onRate)
      video.removeEventListener('volumechange', onVolume)
      window.clearInterval(interval)
      audioRef.current?.pause()
    }
  }, [videoRef, audioRef, audioUrl])
}
