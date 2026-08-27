import { useCallback, useEffect, useRef, useState } from 'react'
import type { QualityOption, StreamSubtitle } from '@shared/types'
import { PlayerControls } from './player/PlayerControls'
import { LoadingOverlay, NoSourcePlaceholder, PlayHintOverlay, SourceErrorOverlay } from './player/PlayerOverlays'
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
  const [retryKey, setRetryKey] = useState(0)

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
    retryKey,
  })

  const { snapshot, captureForQualityChange } = useResumeSnapshot(
    ui.currentTime,
    ui.playing,
    ui.playbackRate,
  )

  const { error: sourceError, reload: reloadSource } = useVideoSource({
    videoRef,
    url: videoUrl,
    isHls,
    resume: snapshot,
  })

  const handleReload = useCallback(() => {
    // Keep the resume position so the reload picks up where playback died.
    captureForQualityChange(videoRef.current)
    setRetryKey((k) => k + 1)
    reloadSource()
  }, [captureForQualityChange, reloadSource])

  useDualAudioSync({ videoRef, audioRef, audioUrl })
  useTextTracks({
    videoRef,
    subtitlesEnabled: isHls ? false : subtitlesEnabled,
    selectedSubtitle: isHls ? undefined : selectedSubtitle,
    mediaKey: videoUrl,
  })

  const interactionBlocked = menuOpen || ui.mediaLoading || sourceError
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
    disabled: ui.mediaLoading || sourceError,
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
    return <NoSourcePlaceholder />
  }

  const showPlayHint = !ui.playing && !ui.mediaLoading && !sourceError
  const showLoading = ui.mediaLoading && !sourceError

  return (
    <div
      ref={shellRef}
      className="group relative -mx-3 overflow-hidden bg-black sm:mx-0 sm:rounded-xl"
      tabIndex={0}
      onMouseMove={() => {
        if (!ui.mediaLoading && !sourceError) ui.showControls()
      }}
      onMouseLeave={() => {
        if (ui.playing && !menuOpen && !ui.mediaLoading && !sourceError) ui.setControlsVisible(false)
      }}
      onClick={ui.mediaLoading || sourceError ? undefined : onPointerUp}
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

        {showLoading ? <LoadingOverlay /> : null}

        {sourceError ? <SourceErrorOverlay onReload={handleReload} /> : null}

        {showPlayHint ? <PlayHintOverlay /> : null}

        <PlayerControls
          visible={(ui.controlsVisible || menuOpen) && !ui.mediaLoading && !sourceError}
          disabled={ui.mediaLoading || sourceError}
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
