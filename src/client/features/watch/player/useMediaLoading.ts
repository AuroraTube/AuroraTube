import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

type Options = {
  videoRef: RefObject<HTMLVideoElement | null>
  audioRef: RefObject<HTMLAudioElement | null>
  usesSplitAudio: boolean
  mediaKey: string | undefined
  /** Bump to force a full reset (e.g. after a manual reload of the same mediaKey). */
  retryKey?: number
}

/**
 * Spinner while the *primary* presentation is not yet playable.
 *
 * Rules (esp. DASH / split A/V):
 * - Once the video element has enough buffered to likely play through
 *   (readyState ≥ HAVE_ENOUGH_DATA) and is not in a true underrun, hide the
 *   spinner — even if the hidden audio track is still buffering.
 * - While video is actively playing, never show loading for audio-only waits.
 * - `error` on video or audio ends the spinner (do not spin forever).
 * - Initial load / quality change (mediaKey) starts in loading state.
 */
export function useMediaLoading({
  videoRef,
  audioRef,
  usesSplitAudio,
  mediaKey,
  retryKey = 0,
}: Options): boolean {
  const [mediaLoading, setMediaLoading] = useState(Boolean(mediaKey))
  /** True after video has reached canplay at least once for this mediaKey. */
  const videoEverReadyRef = useRef(false)
  const videoErrorRef = useRef(false)
  const audioErrorRef = useRef(false)

  const recompute = useCallback(() => {
    const video = videoRef.current
    if (!video || !mediaKey) {
      setMediaLoading(Boolean(mediaKey))
      return
    }

    if (videoErrorRef.current) {
      setMediaLoading(false)
      return
    }

    const videoHasEnough = video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA
    const videoHasCurrent = video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
    const videoPlaying = !video.paused && !video.ended

    if (videoHasEnough) {
      videoEverReadyRef.current = true
    }

    // Video is flowing or has a presentable frame after first ready — no spinner
    // for audio-only buffering (DASH split).
    if (videoPlaying && videoHasCurrent) {
      setMediaLoading(false)
      return
    }

    if (videoHasEnough) {
      // Still waiting on first audio attach only before playback has started.
      if (usesSplitAudio && !audioErrorRef.current && !videoEverReadyRef.current) {
        const audio = audioRef.current
        if (audio && audio.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
          setMediaLoading(true)
          return
        }
      }
      setMediaLoading(false)
      return
    }

    // Not enough video data yet (initial load or genuine underrun).
    setMediaLoading(true)
  }, [videoRef, audioRef, usesSplitAudio, mediaKey])

  // Reset + bind video events when the media source identity changes.
  useEffect(() => {
    videoEverReadyRef.current = false
    videoErrorRef.current = false
    audioErrorRef.current = false
    setMediaLoading(Boolean(mediaKey))

    const video = videoRef.current
    if (!video || !mediaKey) return

    const onReady = () => {
      videoEverReadyRef.current = true
      recompute()
    }
    const onWait = () => {
      // Only treat as loading when the pipeline truly lacks enough buffered data.
      if (video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
        setMediaLoading(true)
      }
      recompute()
    }
    const onError = () => {
      videoErrorRef.current = true
      setMediaLoading(false)
    }

    video.addEventListener('loadstart', onWait)
    video.addEventListener('waiting', onWait)
    video.addEventListener('stalled', onWait)
    video.addEventListener('loadeddata', onReady)
    video.addEventListener('canplay', onReady)
    video.addEventListener('canplaythrough', onReady)
    video.addEventListener('playing', onReady)
    video.addEventListener('seeked', recompute)
    video.addEventListener('progress', recompute)
    video.addEventListener('error', onError)

    // Element may already be ready (e.g. cached).
    recompute()

    return () => {
      video.removeEventListener('loadstart', onWait)
      video.removeEventListener('waiting', onWait)
      video.removeEventListener('stalled', onWait)
      video.removeEventListener('loadeddata', onReady)
      video.removeEventListener('canplay', onReady)
      video.removeEventListener('canplaythrough', onReady)
      video.removeEventListener('playing', onReady)
      video.removeEventListener('seeked', recompute)
      video.removeEventListener('progress', recompute)
      video.removeEventListener('error', onError)
    }
  }, [videoRef, mediaKey, retryKey, recompute])

  // Split audio: listen so first canplay can clear the gate; never keep spinner
  // solely because audio fires waiting mid-playback.
  useEffect(() => {
    if (!usesSplitAudio || !mediaKey) {
      audioErrorRef.current = false
      recompute()
      return
    }

    const audio = audioRef.current
    if (!audio) {
      recompute()
      return
    }

    const onReady = () => recompute()
    const onError = () => {
      audioErrorRef.current = true
      recompute()
    }

    audio.addEventListener('canplay', onReady)
    audio.addEventListener('canplaythrough', onReady)
    audio.addEventListener('loadeddata', onReady)
    audio.addEventListener('playing', onReady)
    audio.addEventListener('error', onError)
    // Intentionally no waiting/stalled/loadstart → those caused spinner flicker
    // while video was already playing.

    recompute()

    return () => {
      audio.removeEventListener('canplay', onReady)
      audio.removeEventListener('canplaythrough', onReady)
      audio.removeEventListener('loadeddata', onReady)
      audio.removeEventListener('playing', onReady)
      audio.removeEventListener('error', onError)
    }
  }, [audioRef, usesSplitAudio, mediaKey, recompute])

  return mediaLoading
}
