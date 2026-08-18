import { useCallback, useEffect, useRef, useState } from 'react'
import type { QualityOption, StreamSubtitle } from '@shared/types'
import { IconPlay } from './player/icons'
import { PlayerControls } from './player/PlayerControls'
import { SeekFlashOverlay } from './player/SeekFlash'
import { VideoElement } from './player/VideoElement'
import { useDualAudioSync } from './player/useDualAudioSync'
import { usePlayerKeyboard } from './player/usePlayerKeyboard'
import { usePlayerTapGestures } from './player/usePlayerTapGestures'
import { usePlayerUi } from './player/usePlayerUi'
import { useResumeSnapshot } from './player/useResumeSnapshot'
import { useTextTracks } from './player/useTextTracks'
import { useVideoSource } from './player/useVideoSource'

type WatchPlayerProps = {
  quality?: QualityOption
  qualities?: QualityOption[]
  onQualityChange?: (id: string) => void
  subtitles?: StreamSubtitle[]
  selectedSubtitle?: StreamSubtitle
  subtitlesEnabled?: boolean
  onSubtitlesEnabledChange?: (enabled: boolean) => void
  onSubtitleChange?: (url: string) => void
}

export function WatchPlayer({
  quality,
  qualities = [],
  onQualityChange,
  subtitles = [],
  selectedSubtitle,
  subtitlesEnabled = false,
  onSubtitlesEnabledChange,
  onSubtitleChange,
}: WatchPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const isHls = Boolean(quality?.isHls || quality?.video.isM3u8)
  const isMuxed = quality?.isMuxed ?? true
  const videoUrl = quality?.video.url
  const audioUrl = !isHls && !isMuxed ? quality?.audio?.url : undefined
  const usesSplitAudio = Boolean(audioUrl)

  const ui = usePlayerUi({
    videoRef,
    audioRef,
    shellRef,
    usesSplitAudio,
    mediaKey: videoUrl,
  })

  const { snapshot, captureForQualityChange } = useResumeSnapshot(
    ui.currentTime,
    ui.playing,
    ui.playbackRate,
  )

  useVideoSource({ videoRef, url: videoUrl, isHls, resume: snapshot })
  useDualAudioSync({ videoRef, audioRef, audioUrl })
  useTextTracks({
    videoRef,
    subtitlesEnabled: isHls ? false : subtitlesEnabled,
    selectedSubtitle: isHls ? undefined : selectedSubtitle,
    mediaKey: videoUrl,
  })

  const interactionBlocked = menuOpen || ui.mediaLoading
  const subtitlesAvailable = !isHls && subtitles.length > 0

  const toggleSubtitles = useCallback(() => {
    onSubtitlesEnabledChange?.(!subtitlesEnabled)
  }, [onSubtitlesEnabledChange, subtitlesEnabled])

  useEffect(() => {
    if (ui.mediaLoading && menuOpen) setMenuOpen(false)
  }, [ui.mediaLoading, menuOpen])

  usePlayerKeyboard({
    enabled: Boolean(videoUrl),
    blocked: interactionBlocked,
    hlsRestricted: isHls,
    volume: ui.volume,
    muted: ui.muted,
    togglePlay: ui.togglePlay,
    toggleMute: ui.toggleMute,
    toggleFullscreen: ui.toggleFullscreen,
    togglePictureInPicture: ui.togglePictureInPicture,
    toggleSubtitles: subtitlesAvailable ? toggleSubtitles : undefined,
    subtitlesAvailable,
    seekBy: ui.seekBy,
    seekTo: ui.seekTo,
    setVolumeLevel: ui.setVolumeLevel,
    showControls: ui.showControls,
  })

  const { onPointerUp, flash } = usePlayerTapGestures({
    seekBy: ui.seekBy,
    togglePlay: ui.togglePlay,
    toggleFullscreen: ui.toggleFullscreen,
    showControls: ui.showControls,
    hlsRestricted: isHls,
    disabled: ui.mediaLoading,
  })

  // Keep split-audio element loading in parallel with video.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return
    audio.preload = 'auto'
    try {
      audio.load()
    } catch {
      /* ignore */
    }
  }, [audioUrl])

  if (!videoUrl) {
    return (
      <div className="relative -mx-3 overflow-hidden bg-black sm:mx-0 sm:rounded-xl">
        <div className="flex aspect-video items-center justify-center text-white/55">
          再生 URL がありません。
        </div>
      </div>
    )
  }

  const showPlayHint = !ui.playing && !ui.mediaLoading
  const showLoading = ui.mediaLoading

  return (
    <div
      ref={shellRef}
      className="group relative -mx-3 overflow-hidden bg-black sm:mx-0 sm:rounded-xl"
      tabIndex={0}
      onMouseMove={() => {
        if (!ui.mediaLoading) ui.showControls()
      }}
      onMouseLeave={() => {
        if (ui.playing && !menuOpen && !ui.mediaLoading) ui.setControlsVisible(false)
      }}
      onClick={ui.mediaLoading ? undefined : onPointerUp}
    >
      <div className="relative aspect-video">
        <VideoElement
          videoRef={videoRef}
          muted={usesSplitAudio || ui.muted}
          subtitles={isHls ? [] : subtitles}
        />
        {audioUrl ? (
          <audio ref={audioRef} src={audioUrl} preload="auto" key={audioUrl} playsInline />
        ) : null}

        {!isHls ? <SeekFlashOverlay flash={flash} /> : null}

        {showLoading ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/35">
            <div
              className="h-12 w-12 animate-spin rounded-full border-2 border-white/25 border-t-white"
              role="status"
              aria-label="読み込み中"
            />
          </div>
        ) : null}

        {showPlayHint ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm">
              <IconPlay className="ml-1 h-8 w-8" />
            </div>
          </div>
        ) : null}

        <PlayerControls
          visible={(ui.controlsVisible || menuOpen) && !ui.mediaLoading}
          disabled={ui.mediaLoading}
          playing={ui.playing}
          currentTime={ui.currentTime}
          duration={ui.duration}
          buffered={ui.buffered}
          volume={ui.volume}
          muted={ui.muted}
          isFullscreen={ui.isFullscreen}
          playbackRate={ui.playbackRate}
          onPlaybackRateChange={ui.setPlaybackRate}
          qualities={qualities}
          selectedQualityId={quality?.id}
          onQualityChange={(id) => {
            captureForQualityChange(videoRef.current)
            onQualityChange?.(id)
          }}
          subtitles={subtitles}
          subtitlesEnabled={subtitlesEnabled}
          selectedSubtitleUrl={selectedSubtitle?.url}
          onSubtitlesEnabledChange={(v) => onSubtitlesEnabledChange?.(v)}
          onSubtitleChange={(url) => onSubtitleChange?.(url)}
          onTogglePlay={ui.togglePlay}
          onToggleMute={ui.toggleMute}
          onToggleFullscreen={ui.toggleFullscreen}
          isPip={ui.isPip}
          pipSupported={ui.pipSupported}
          onTogglePictureInPicture={ui.togglePictureInPicture}
          onSeek={ui.seekTo}
          onBeginSeek={ui.beginSeek}
          onEndSeek={ui.endSeek}
          onVolume={ui.setVolumeLevel}
          onMenuOpenChange={setMenuOpen}
          hlsRestricted={isHls}
        />
      </div>
    </div>
  )
}
