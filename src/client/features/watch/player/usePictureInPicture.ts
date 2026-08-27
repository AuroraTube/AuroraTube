import { useCallback, useEffect, useState, type RefObject } from 'react'

/**
 * HTMLVideoElement Picture-in-Picture.
 * Exits fullscreen (and any other PiP element) before entering.
 */
export function usePictureInPicture(
  videoRef: RefObject<HTMLVideoElement | null>,
  mediaKey: string | undefined,
  onToggle?: () => void,
) {
  const [isPip, setIsPip] = useState(false)
  const [pipSupported, setPipSupported] = useState(false)

  useEffect(() => {
    const supported =
      typeof document !== 'undefined' &&
      'pictureInPictureEnabled' in document &&
      Boolean(document.pictureInPictureEnabled)
    setPipSupported(supported)

    const video = videoRef.current
    if (!video) {
      setIsPip(false)
      return
    }

    const onEnter = () => setIsPip(true)
    const onLeave = () => setIsPip(false)
    video.addEventListener('enterpictureinpicture', onEnter)
    video.addEventListener('leavepictureinpicture', onLeave)
    setIsPip(document.pictureInPictureElement === video)

    return () => {
      video.removeEventListener('enterpictureinpicture', onEnter)
      video.removeEventListener('leavepictureinpicture', onLeave)
    }
  }, [videoRef, mediaKey])

  const togglePictureInPicture = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    if (!document.pictureInPictureEnabled) return
    if (video.disablePictureInPicture) return

    try {
      if (document.pictureInPictureElement === video) {
        await document.exitPictureInPicture()
      } else {
        if (document.fullscreenElement) {
          try {
            await document.exitFullscreen()
          } catch {
            /* ignore */
          }
        }
        if (document.pictureInPictureElement) {
          try {
            await document.exitPictureInPicture()
          } catch {
            /* ignore */
          }
        }
        await video.requestPictureInPicture()
      }
    } catch {
      /* NotAllowedError / InvalidStateError when no video frame yet */
    }
    onToggle?.()
  }, [videoRef, onToggle])

  return { isPip, pipSupported, togglePictureInPicture }
}
