import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

type Options = {
  videoRef: RefObject<HTMLVideoElement | null>
  audioRef: RefObject<HTMLAudioElement | null>
  usesSplitAudio: boolean
  mediaKey: string | undefined
  /** Bump to force a full reset (e.g. after a manual reload of the same mediaKey). */
  retryKey?: number
}

/** Poll interval used as a safety net alongside media events (see module doc below). */
const WATCHDOG_INTERVAL_MS = 250

/**
 * Grace period before a video `waiting`/`stalled` event is trusted enough to
 * re-show the spinner. The browser's `HAVE_ENOUGH_DATA` threshold is a
 * buffer-health *estimate* (lookahead time at the current playback rate),
 * not a direct read of buffered seconds — it can dip for a moment even with
 * a healthy buffer, more so on high-bitrate/split-audio streams. Waiting out
 * this window lets same-tick recoveries pass silently; a real stall still
 * surfaces the spinner, just delayed by this much.
 */
const STALL_DEBOUNCE_MS = 200

/**
 * Spinner while the *primary* presentation is not yet playable.
 *
 * The gate is the browser's own native readiness signal on the `<video>`
 * element (`readyState >= HAVE_ENOUGH_DATA`) — nothing is inferred from
 * `paused`/`playing` state. A lower bar such as `HAVE_CURRENT_DATA` only
 * means "there's a frame to paint right now", not "this will keep playing
 * without stalling", so using it to hide the spinner let it disappear
 * before the video was actually loaded enough. `HAVE_ENOUGH_DATA` is the
 * native contract the browser itself uses to decide the media can play
 * through without immediately buffering again.
 *
 * For split A/V (separate `<video>` and `<audio>` elements — labelled
 * "DASH" by users, since it's the same separate-track shape as MPEG-DASH),
 * readiness is latched *independently* per element: `videoReadyRef` flips
 * to true the first time the video reaches `HAVE_ENOUGH_DATA`, and
 * `audioReadyRef` flips independently the first time the audio does.
 * The spinner clears only once both are true. Two independent refs (rather
 * than a single combined "first ready" flag) matter because video and
 * audio fire their readiness events (`loadeddata`, `canplay`,
 * `canplaythrough`, `playing`) independently and out of order: a shared
 * flag that gets consumed by whichever element's event happens to arrive
 * first would let a *later, unrelated* video event bypass the audio check
 * (or vice versa) and clear the spinner while the other track was still
 * buffering — the spinner would then also fail to reappear, since the
 * flag had already been spent. Per-track latches make the gate correct
 * regardless of event order.
 *
 * Recompute runs from media events for responsiveness, plus a lightweight
 * watchdog poll while still loading, so the spinner clears as soon as
 * `readyState` actually reflects reality even if a browser fails to fire
 * (or coalesces) one of the events above — this keeps the spinner's timing
 * matched to the real buffering state instead of drifting from it.
 *
 * Rules:
 * - Spinner hides only once both tracks have (each, independently) reached
 *   `HAVE_ENOUGH_DATA` at least once.
 * - `error` on video or audio ends the spinner for that track (does not
 *   block forever on a track that will never load).
 * - Initial load / quality change (mediaKey) starts in loading state.
 * - On the video element, `waiting`/`stalled` are debounced by
 *   `STALL_DEBOUNCE_MS` before they can flip readiness back off (see const
 *   doc above); `loadstart` (a genuine new-source reset) is not debounced.
 *   Audio deliberately skips `waiting`/`stalled` entirely rather than
 *   debouncing them: a stalled audio track has no visible symptom of its
 *   own (it's a hidden element; sync/mute is owned by useDualAudioSync), so
 *   there was nothing worth waiting to confirm. Video can't do the same —
 *   a real mid-playback stall freezes the visible frame, and that's a
 *   genuine state worth surfacing the spinner for — so it gets a debounce
 *   instead of an outright removal.
 */
export function useMediaLoading({
  videoRef,
  audioRef,
  usesSplitAudio,
  mediaKey,
  retryKey = 0,
}: Options): boolean {
  const [mediaLoading, setMediaLoading] = useState(Boolean(mediaKey))
  const videoReadyRef = useRef(false)
  const audioReadyRef = useRef(false)
  const videoErrorRef = useRef(false)
  const audioErrorRef = useRef(false)
  const stallTimerRef = useRef<number | null>(null)

  const recompute = useCallback(() => {
    const video = videoRef.current
    if (!video || !mediaKey) {
      setMediaLoading(Boolean(mediaKey))
      return
    }

    if (videoErrorRef.current) {
      setMediaLoading(false)
      return
    }

    if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      videoReadyRef.current = true
    }
    if (!videoReadyRef.current) {
      setMediaLoading(true)
      return
    }

    if (usesSplitAudio && !audioErrorRef.current) {
      const audio = audioRef.current
      if (audio && audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
        audioReadyRef.current = true
      }
      if (!audioReadyRef.current) {
        setMediaLoading(true)
        return
      }
    }

    setMediaLoading(false)
  }, [videoRef, audioRef, usesSplitAudio, mediaKey])

  // Reset + bind video events when the media source identity changes.
  useEffect(() => {
    videoReadyRef.current = false
    audioReadyRef.current = false
    videoErrorRef.current = false
    audioErrorRef.current = false
    if (stallTimerRef.current !== null) {
      window.clearTimeout(stallTimerRef.current)
      stallTimerRef.current = null
    }
    setMediaLoading(Boolean(mediaKey))

    const video = videoRef.current
    if (!video || !mediaKey) return

    const clearPendingStall = () => {
      if (stallTimerRef.current !== null) {
        window.clearTimeout(stallTimerRef.current)
        stallTimerRef.current = null
      }
    }

    const onReady = () => {
      // A genuine readiness event always wins over a pending stall check —
      // no need to wait out the debounce once we already know it recovered.
      clearPendingStall()
      recompute()
    }

    // New source identity (quality switch, HLS internal reload): reset
    // immediately. This is not a transient dip, so it isn't debounced.
    const onLoadStart = () => {
      clearPendingStall()
      if (video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
        videoReadyRef.current = false
      }
      recompute()
    }

    // `waiting`/`stalled` mid-playback: debounce before trusting it, since
    // the browser's readiness heuristic can dip for a moment on its own
    // (see STALL_DEBOUNCE_MS doc above) even with a healthy buffer.
    const onStall = () => {
      if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) return
      clearPendingStall()
      stallTimerRef.current = window.setTimeout(() => {
        stallTimerRef.current = null
        if (video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
          videoReadyRef.current = false
        }
        recompute()
      }, STALL_DEBOUNCE_MS)
    }

    const onError = () => {
      clearPendingStall()
      videoErrorRef.current = true
      recompute()
    }

    video.addEventListener('loadstart', onLoadStart)
    video.addEventListener('waiting', onStall)
    video.addEventListener('stalled', onStall)
    video.addEventListener('loadeddata', onReady)
    video.addEventListener('canplay', onReady)
    video.addEventListener('canplaythrough', onReady)
    video.addEventListener('playing', onReady)
    video.addEventListener('seeked', recompute)
    video.addEventListener('progress', recompute)
    video.addEventListener('error', onError)

    // Element may already be ready (e.g. cached).
    recompute()

    return () => {
      clearPendingStall()
      video.removeEventListener('loadstart', onLoadStart)
      video.removeEventListener('waiting', onStall)
      video.removeEventListener('stalled', onStall)
      video.removeEventListener('loadeddata', onReady)
      video.removeEventListener('canplay', onReady)
      video.removeEventListener('canplaythrough', onReady)
      video.removeEventListener('playing', onReady)
      video.removeEventListener('seeked', recompute)
      video.removeEventListener('progress', recompute)
      video.removeEventListener('error', onError)
    }
  }, [videoRef, mediaKey, retryKey, recompute])

  // Split audio: listen so the audio track's own readiness can latch and
  // (via recompute) clear the gate. Intentionally no waiting/stalled here —
  // those caused spinner flicker while video was already playing; a mid-
  // playback audio stall does not need to re-show the spinner.
  useEffect(() => {
    if (!usesSplitAudio || !mediaKey) {
      audioErrorRef.current = false
      recompute()
      return
    }

    const audio = audioRef.current
    if (!audio) {
      recompute()
      return
    }

    const onReady = () => recompute()
    const onError = () => {
      audioErrorRef.current = true
      recompute()
    }

    audio.addEventListener('canplay', onReady)
    audio.addEventListener('canplaythrough', onReady)
    audio.addEventListener('loadeddata', onReady)
    audio.addEventListener('playing', onReady)
    audio.addEventListener('error', onError)

    recompute()

    return () => {
      audio.removeEventListener('canplay', onReady)
      audio.removeEventListener('canplaythrough', onReady)
      audio.removeEventListener('loadeddata', onReady)
      audio.removeEventListener('playing', onReady)
      audio.removeEventListener('error', onError)
    }
  }, [audioRef, usesSplitAudio, mediaKey, recompute])

  // Watchdog: while still loading, re-check readyState on a short interval.
  // Browsers occasionally coalesce or drop `canplay`/`playing` events (most
  // often on the hidden split-audio element), which previously left the
  // spinner stuck even though playback had actually become ready — this
  // poll guarantees the spinner's dismissal timing eventually converges on
  // the element's real `readyState` regardless of which events fired.
  useEffect(() => {
    if (!mediaLoading || !mediaKey) return
    const id = window.setInterval(recompute, WATCHDOG_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [mediaLoading, mediaKey, recompute])

  return mediaLoading
}
