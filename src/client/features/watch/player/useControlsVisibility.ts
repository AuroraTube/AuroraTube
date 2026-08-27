import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

const HIDE_DELAY_MS = 2800

/**
 * Auto-hide player chrome while playing; keep visible when paused or after interaction.
 */
export function useControlsVisibility(videoRef: RefObject<HTMLVideoElement | null>) {
  const hideTimer = useRef<number | null>(null)
  const [controlsVisible, setControlsVisible] = useState(true)

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current != null) {
      window.clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }, [])

  const scheduleHide = useCallback(() => {
    clearHideTimer()
    hideTimer.current = window.setTimeout(() => {
      const v = videoRef.current
      if (v && !v.paused) setControlsVisible(false)
    }, HIDE_DELAY_MS)
  }, [clearHideTimer, videoRef])

  const showControls = useCallback(() => {
    setControlsVisible(true)
    scheduleHide()
  }, [scheduleHide])

  useEffect(() => () => clearHideTimer(), [clearHideTimer])

  return {
    controlsVisible,
    setControlsVisible,
    showControls,
    scheduleHide,
    clearHideTimer,
  }
}
