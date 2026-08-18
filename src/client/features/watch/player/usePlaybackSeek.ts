import { useCallback, type Dispatch, type RefObject, type SetStateAction } from 'react'

type Options = {
  videoRef: RefObject<HTMLVideoElement | null>
  setCurrentTime: Dispatch<SetStateAction<number>>
  showControls: () => void
}

/** Seek by ratio (0–1) or relative seconds. */
export function usePlaybackSeek({ videoRef, setCurrentTime, showControls }: Options) {
  const seekTo = useCallback(
    (ratio: number) => {
      const video = videoRef.current
      if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return
      const t = Math.max(0, Math.min(1, ratio)) * video.duration
      video.currentTime = t
      setCurrentTime(t)
    },
    [videoRef, setCurrentTime],
  )

  const seekBy = useCallback(
    (deltaSec: number) => {
      const video = videoRef.current
      if (!video) return
      const duration =
        Number.isFinite(video.duration) && video.duration > 0 ? video.duration : Infinity
      const next = Math.max(0, Math.min(duration, video.currentTime + deltaSec))
      video.currentTime = next
      setCurrentTime(next)
      showControls()
    },
    [videoRef, setCurrentTime, showControls],
  )

  return { seekTo, seekBy }
}
