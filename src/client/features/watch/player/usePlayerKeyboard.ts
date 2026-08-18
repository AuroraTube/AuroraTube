import { useEffect } from 'react'
import { SEEK_STEP_SEC, VOLUME_STEP } from './constants'

type Options = {
  enabled: boolean
  blocked?: boolean
  hlsRestricted?: boolean
  volume: number
  muted: boolean
  togglePlay: () => void
  toggleMute: () => void
  toggleFullscreen: () => void
  togglePictureInPicture?: () => void
  toggleSubtitles?: () => void
  subtitlesAvailable?: boolean
  seekBy: (deltaSec: number) => void
  seekTo: (ratio: number) => void
  setVolumeLevel: (v: number) => void
  showControls: () => void
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (el.isContentEditable) return true
  return Boolean(el.closest('[contenteditable="true"]'))
}

/**
 * Keyboard shortcuts for the watch player.
 * When `hlsRestricted`, seek, numeric jump, and captions are disabled.
 */
export function usePlayerKeyboard({
  enabled,
  blocked,
  hlsRestricted = false,
  togglePlay,
  toggleMute,
  toggleFullscreen,
  togglePictureInPicture,
  toggleSubtitles,
  subtitlesAvailable = false,
  seekBy,
  seekTo,
  setVolumeLevel,
  volume,
  muted,
  showControls,
}: Options): void {
  useEffect(() => {
    if (!enabled) return

    const onKey = (e: KeyboardEvent) => {
      if (blocked) return
      if (e.altKey || e.ctrlKey || e.metaKey) return
      if (isTypingTarget(e.target)) return

      const key = e.key
      let handled = true

      switch (key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault()
          togglePlay()
          break
        case 'j':
        case 'J':
        case 'ArrowLeft':
          if (hlsRestricted) {
            handled = false
            break
          }
          e.preventDefault()
          seekBy(-SEEK_STEP_SEC)
          break
        case 'l':
        case 'L':
        case 'ArrowRight':
          if (hlsRestricted) {
            handled = false
            break
          }
          e.preventDefault()
          seekBy(SEEK_STEP_SEC)
          break
        case 'ArrowUp':
          e.preventDefault()
          setVolumeLevel(Math.min(1, (muted ? 0 : volume) + VOLUME_STEP))
          showControls()
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolumeLevel(Math.max(0, (muted ? 0 : volume) - VOLUME_STEP))
          showControls()
          break
        case 'm':
        case 'M':
          e.preventDefault()
          toggleMute()
          break
        case 'f':
        case 'F':
          e.preventDefault()
          void toggleFullscreen()
          break
        case 'i':
        case 'I':
          if (!togglePictureInPicture) {
            handled = false
            break
          }
          e.preventDefault()
          void togglePictureInPicture()
          break
        case 'c':
        case 'C':
          if (hlsRestricted || !subtitlesAvailable || !toggleSubtitles) {
            handled = false
            break
          }
          e.preventDefault()
          toggleSubtitles()
          break
        case 'Home':
          if (hlsRestricted) {
            handled = false
            break
          }
          e.preventDefault()
          seekTo(0)
          showControls()
          break
        case 'End':
          if (hlsRestricted) {
            handled = false
            break
          }
          e.preventDefault()
          seekTo(1)
          showControls()
          break
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          if (hlsRestricted) {
            handled = false
            break
          }
          e.preventDefault()
          seekTo(Number(key) / 10)
          showControls()
          break
        default:
          handled = false
      }

      if (handled) showControls()
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    enabled,
    blocked,
    hlsRestricted,
    togglePlay,
    toggleMute,
    toggleFullscreen,
    togglePictureInPicture,
    toggleSubtitles,
    subtitlesAvailable,
    seekBy,
    seekTo,
    setVolumeLevel,
    volume,
    muted,
    showControls,
  ])
}
