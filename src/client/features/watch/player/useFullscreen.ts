import { useCallback, useEffect, useState, type RefObject } from 'react'

/**
 * Document fullscreen for the player shell element.
 */
export function useFullscreen(
  shellRef: RefObject<HTMLElement | null>,
  onToggle?: () => void,
) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    const el = shellRef.current
    if (!el) return
    try {
      if (!document.fullscreenElement) await el.requestFullscreen()
      else await document.exitFullscreen()
    } catch {
      /* blocked by browser policy */
    }
    onToggle?.()
  }, [shellRef, onToggle])

  return { isFullscreen, toggleFullscreen }
}
