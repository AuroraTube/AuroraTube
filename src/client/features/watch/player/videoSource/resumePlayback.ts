export type ResumeSnapshot = { time: number; play: boolean; rate: number } | undefined

/**
 * Applies a resume snapshot (seek position, playback rate, autoplay) the
 * first time the media element becomes ready, then stays inert. Shared by
 * every playback strategy (hls.js, native HLS, progressive) so resume
 * behavior stays identical regardless of how the source was attached.
 */
export function createResumeController(video: HTMLVideoElement, snapshot: ResumeSnapshot) {
  let applied = false
  let cancelled = false

  const apply = () => {
    if (cancelled || applied) return
    applied = true

    if (snapshot && snapshot.time > 0 && Number.isFinite(snapshot.time)) {
      try {
        video.currentTime = snapshot.time
      } catch {
        /* ignore */
      }
    }
    if (snapshot?.rate) video.playbackRate = snapshot.rate
    if (snapshot?.play !== false) {
      void video.play().catch(() => {
        /* Autoplay may be blocked; user can tap play. */
      })
    }
  }

  const bindOnce = () => {
    video.addEventListener('loadedmetadata', apply, { once: true })
    video.addEventListener('canplay', apply, { once: true })
  }

  const unbind = () => {
    video.removeEventListener('loadedmetadata', apply)
    video.removeEventListener('canplay', apply)
  }

  return {
    apply,
    bindOnce,
    cancel: () => {
      cancelled = true
      unbind()
    },
  }
}

export type ResumeController = ReturnType<typeof createResumeController>
