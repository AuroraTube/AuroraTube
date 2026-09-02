import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

type Options = {
  videoRef: RefObject<HTMLVideoElement | null>
  audioRef: RefObject<HTMLAudioElement | null>
  usesSplitAudio: boolean
  /** Re-apply when the media source identity changes (quality / URL). */
  mediaKey: string | undefined
}

/**
 * Volume, mute, and playback-rate state that survives quality switches.
 * HTMLMediaElement resets these on new `src`; we re-push React state onto the elements.
 */
export function useMediaLevels({ videoRef, audioRef, usesSplitAudio, mediaKey }: Options) {
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [playbackRate, setPlaybackRateState] = useState(1)

  const volumeRef = useRef(volume)
  const mutedRef = useRef(muted)
  const rateRef = useRef(playbackRate)
  volumeRef.current = volume
  mutedRef.current = muted
  rateRef.current = playbackRate

  const applyingRef = useRef(false)

  const apply = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    applyingRef.current = true
    try {
      const vol = volumeRef.current
      const isMuted = mutedRef.current
      const rate = rateRef.current
      const audio = audioRef.current

      video.volume = vol
      video.playbackRate = rate

      if (usesSplitAudio) {
        video.muted = true
        if (audio) {
          audio.volume = vol
          audio.muted = isMuted
          audio.playbackRate = rate
        }
      } else {
        video.muted = isMuted
        if (audio) {
          audio.volume = vol
          audio.muted = isMuted
          audio.playbackRate = rate
        }
      }
    } catch {
      /* InvalidStateError during teardown */
    } finally {
      queueMicrotask(() => {
        applyingRef.current = false
      })
    }
  }, [videoRef, audioRef, usesSplitAudio])

  // Keep elements aligned with UI state and after source swaps.
  useEffect(() => {
    apply()
  }, [mediaKey, volume, muted, playbackRate, usesSplitAudio, apply])

  /** Sync React state from the video element (user gesture / browser UI). */
  const onVideoVolumeChange = useCallback(() => {
    if (applyingRef.current || usesSplitAudio) return
    const video = videoRef.current
    if (!video) return
    setVolume(video.volume)
    setMuted(video.muted)
  }, [videoRef, usesSplitAudio])

  const setVolumeLevel = useCallback(
    (v: number) => {
      const clamped = Math.max(0, Math.min(1, v))
      setVolume(clamped)
      setMuted(clamped === 0)
      volumeRef.current = clamped
      mutedRef.current = clamped === 0
      apply()
    },
    [apply],
  )

  const toggleMute = useCallback(() => {
    if (mutedRef.current || volumeRef.current === 0) {
      const restored = volumeRef.current === 0 ? 1 : volumeRef.current
      setVolume(restored)
      setMuted(false)
      volumeRef.current = restored
      mutedRef.current = false
    } else {
      setMuted(true)
      mutedRef.current = true
    }
    apply()
  }, [apply])

  const setPlaybackRate = useCallback(
    (rate: number) => {
      const r = Math.max(0.25, Math.min(2, rate))
      setPlaybackRateState(r)
      rateRef.current = r
      apply()
    },
    [apply],
  )

  return {
    volume,
    muted,
    playbackRate,
    apply,
    onVideoVolumeChange,
    setVolumeLevel,
    toggleMute,
    setPlaybackRate,
  }
}
