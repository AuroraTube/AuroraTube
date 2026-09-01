import { useCallback, useEffect, useRef, useState } from 'react'

export type ResumeSnapshot = {
  time: number
  play: boolean
  rate: number
}

/** Default: autoplay on first attach; quality changes capture real pause/play state. */
const INITIAL: ResumeSnapshot = { time: 0, play: true, rate: 1 }

/**
 * Capture playback position / play state / rate when switching quality.
 */
export function useResumeSnapshot(currentTime: number, playing: boolean, playbackRate: number) {
  const timeRef = useRef(0)
  const playingRef = useRef(false)
  const [snapshot, setSnapshot] = useState<ResumeSnapshot>(INITIAL)

  useEffect(() => {
    timeRef.current = currentTime
  }, [currentTime])
  useEffect(() => {
    playingRef.current = playing
  }, [playing])

  const captureForQualityChange = useCallback(
    (video: HTMLVideoElement | null) => {
      const next: ResumeSnapshot = {
        time: video?.currentTime ?? timeRef.current,
        play: video ? !video.paused : playingRef.current,
        rate: playbackRate,
      }
      setSnapshot(next)
    },
    [playbackRate],
  )

  return { snapshot, captureForQualityChange }
}
