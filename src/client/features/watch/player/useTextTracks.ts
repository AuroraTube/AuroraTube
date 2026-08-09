import { useEffect, useRef, type RefObject } from 'react'
import type { StreamSubtitle } from '@shared/types'
import { trackSrcMatches } from './trackSrc'

type Options = {
  videoRef: RefObject<HTMLVideoElement | null>
  subtitlesEnabled: boolean
  selectedSubtitle?: StreamSubtitle
  mediaKey: string | undefined
}

/** Sync TextTrack modes — at most one track is `showing`. */
export function useTextTracks({
  videoRef,
  subtitlesEnabled,
  selectedSubtitle,
  mediaKey,
}: Options): void {
  const applyingRef = useRef(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const apply = () => {
      if (applyingRef.current) return
      applyingRef.current = true
      try {
        const tracks = video.textTracks
        const els = video.querySelectorAll('track')

        for (let i = 0; i < tracks.length; i++) {
          tracks[i].mode = 'disabled'
        }

        if (!subtitlesEnabled || !selectedSubtitle) return

        let showIndex = -1
        for (let i = 0; i < els.length; i++) {
          if (trackSrcMatches(els[i], selectedSubtitle.url)) {
            showIndex = i
            break
          }
        }

        if (showIndex < 0 && selectedSubtitle.languageCode) {
          for (let i = 0; i < tracks.length; i++) {
            if (tracks[i].language === selectedSubtitle.languageCode) {
              showIndex = i
              break
            }
          }
        }

        if (showIndex >= 0 && showIndex < tracks.length) {
          tracks[showIndex].mode = 'showing'
        }
      } finally {
        applyingRef.current = false
      }
    }

    apply()
    video.addEventListener('loadedmetadata', apply)
    // addtrack only — do not listen to "change" (mode writes would re-enter)
    video.textTracks.addEventListener('addtrack', apply)
    const t1 = window.setTimeout(apply, 150)
    const t2 = window.setTimeout(apply, 500)

    return () => {
      video.removeEventListener('loadedmetadata', apply)
      video.textTracks.removeEventListener('addtrack', apply)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [videoRef, subtitlesEnabled, selectedSubtitle, mediaKey])
}
