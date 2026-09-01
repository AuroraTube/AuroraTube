import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { DOUBLE_TAP_MS, SEEK_STEP_SEC } from './constants'

export type SeekFlash = {
  id: number
  side: 'left' | 'right'
  seconds: number
} | null

type Options = {
  seekBy: (deltaSec: number) => void
  togglePlay: () => void
  toggleFullscreen: () => void
  showControls: () => void
  /** HLS: seek via double-tap is disabled; play and center double-tap fullscreen remain. */
  hlsRestricted?: boolean
  /** While media is loading — ignore all gestures. */
  disabled?: boolean
}

/**
 * Single click: play/pause.
 * Double-tap left/right: ±seek (disabled when `hlsRestricted`).
 * Center double-tap: fullscreen.
 */
export function usePlayerTapGestures({
  seekBy,
  togglePlay,
  toggleFullscreen,
  showControls,
  hlsRestricted = false,
  disabled = false,
}: Options) {
  const lastTap = useRef<{ t: number; side: 'left' | 'center' | 'right' } | null>(null)
  const singleTimer = useRef<number | null>(null)
  const [flash, setFlash] = useState<SeekFlash>(null)
  const flashId = useRef(0)

  const clearSingle = () => {
    if (singleTimer.current != null) {
      window.clearTimeout(singleTimer.current)
      singleTimer.current = null
    }
  }

  // Prevent the pending single-tap timer from firing togglePlay() against a
  // player that's already been unmounted (e.g. navigating away mid double-tap window).
  useEffect(() => clearSingle, [])

  const showFlash = (side: 'left' | 'right', seconds: number) => {
    flashId.current += 1
    const id = flashId.current
    setFlash({ id, side, seconds })
    window.setTimeout(() => {
      setFlash((cur) => (cur?.id === id ? null : cur))
    }, 600)
  }

  const zoneFromEvent = (e: MouseEvent): 'left' | 'center' | 'right' => {
    const el = e.currentTarget as HTMLElement
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const ratio = rect.width > 0 ? x / rect.width : 0.5
    if (ratio < 0.33) return 'left'
    if (ratio > 0.67) return 'right'
    return 'center'
  }

  const onPointerUp = useCallback(
    (e: MouseEvent) => {
      if (disabled) return
      if ((e.target as HTMLElement).closest('[data-controls]')) return
      if (e.button !== 0) return

      const side = zoneFromEvent(e)
      const now = Date.now()
      const prev = lastTap.current

      if (prev && now - prev.t <= DOUBLE_TAP_MS && prev.side === side) {
        clearSingle()
        lastTap.current = null
        if (hlsRestricted) {
          if (side === 'center') {
            void toggleFullscreen()
            showControls()
          }
          return
        }
        if (side === 'left') {
          seekBy(-SEEK_STEP_SEC)
          showFlash('left', SEEK_STEP_SEC)
        } else if (side === 'right') {
          seekBy(SEEK_STEP_SEC)
          showFlash('right', SEEK_STEP_SEC)
        } else {
          void toggleFullscreen()
        }
        showControls()
        return
      }

      lastTap.current = { t: now, side }
      clearSingle()
      singleTimer.current = window.setTimeout(() => {
        singleTimer.current = null
        lastTap.current = null
        togglePlay()
      }, DOUBLE_TAP_MS)
    },
    [seekBy, togglePlay, toggleFullscreen, showControls, hlsRestricted, disabled],
  )

  return { onPointerUp, flash }
}
