import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { useControlsVisibility } from './useControlsVisibility'
import { useFullscreen } from './useFullscreen'
import { useMediaLevels } from './useMediaLevels'
import { useMediaLoading } from './useMediaLoading'
import { usePictureInPicture } from './usePictureInPicture'
import { usePlaybackSeek } from './usePlaybackSeek'

type Options = {
  videoRef: RefObject<HTMLVideoElement | null>
  audioRef: RefObject<HTMLAudioElement | null>
  shellRef: RefObject<HTMLElement | null>
  usesSplitAudio: boolean
  mediaKey: string | undefined
}

/**
 * Player chrome: play/pause, time, volume, fullscreen, PiP, auto-hide controls, loading.
 * Volume / mute / rate persist across quality (mediaKey) changes via useMediaLevels.
 * Controls visibility is owned by useControlsVisibility.
 */
export function usePlayerUi({
  videoRef,
  audioRef,
  shellRef,
  usesSplitAudio,
  mediaKey,
}: Options) {
  const seekingRef = useRef(false)

  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)

  const levels = useMediaLevels({ videoRef, audioRef, usesSplitAudio, mediaKey })
  const mediaLoading = useMediaLoading({ videoRef, audioRef, usesSplitAudio, mediaKey })
  const {
    controlsVisible,
    setControlsVisible,
    showControls,
    scheduleHide,
    clearHideTimer,
  } = useControlsVisibility(videoRef)

  const { seekTo, seekBy } = usePlaybackSeek({ videoRef, setCurrentTime, showControls })
  const { isFullscreen, toggleFullscreen } = useFullscreen(shellRef, showControls)
  const { isPip, pipSupported, togglePictureInPicture } = usePictureInPicture(
    videoRef,
    mediaKey,
    showControls,
  )

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    setDuration(0)
    setBuffered(0)
    setCurrentTime(0)
    setPlaying(false)
    levels.apply()

    const onPlay = () => {
      setPlaying(true)
      scheduleHide()
    }
    const onPause = () => {
      setPlaying(false)
      setControlsVisible(true)
      clearHideTimer()
    }
    const onTime = () => {
      if (!seekingRef.current) setCurrentTime(video.currentTime)
    }
    const onMeta = () => {
      setDuration(video.duration || 0)
      levels.apply()
    }
    const onDuration = () => setDuration(video.duration || 0)
    const onProgress = () => {
      try {
        if (video.buffered.length > 0) {
          setBuffered(video.buffered.end(video.buffered.length - 1))
        }
      } catch {
        /* InvalidStateError */
      }
    }
    const onLoadStart = () => levels.apply()

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('timeupdate', onTime)
    video.addEventListener('loadedmetadata', onMeta)
    video.addEventListener('durationchange', onDuration)
    video.addEventListener('progress', onProgress)
    video.addEventListener('volumechange', levels.onVideoVolumeChange)
    video.addEventListener('loadstart', onLoadStart)

    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('timeupdate', onTime)
      video.removeEventListener('loadedmetadata', onMeta)
      video.removeEventListener('durationchange', onDuration)
      video.removeEventListener('progress', onProgress)
      video.removeEventListener('volumechange', levels.onVideoVolumeChange)
      video.removeEventListener('loadstart', onLoadStart)
    }
  }, [
    videoRef,
    mediaKey,
    scheduleHide,
    clearHideTimer,
    setControlsVisible,
    levels.apply,
    levels.onVideoVolumeChange,
  ])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) void video.play().catch(() => undefined)
    else video.pause()
    showControls()
  }, [videoRef, showControls])

  const beginSeek = useCallback(() => {
    seekingRef.current = true
  }, [])

  const endSeek = useCallback(() => {
    seekingRef.current = false
  }, [])

  const toggleMute = useCallback(() => {
    levels.toggleMute()
    showControls()
  }, [levels.toggleMute, showControls])

  return {
    playing,
    currentTime,
    duration,
    buffered,
    volume: levels.volume,
    muted: levels.muted,
    controlsVisible,
    isFullscreen,
    isPip,
    pipSupported,
    playbackRate: levels.playbackRate,
    mediaLoading,
    showControls,
    setControlsVisible,
    togglePlay,
    seekTo,
    seekBy,
    beginSeek,
    endSeek,
    setVolumeLevel: levels.setVolumeLevel,
    toggleMute,
    toggleFullscreen,
    togglePictureInPicture,
    setPlaybackRate: levels.setPlaybackRate,
  }
}
