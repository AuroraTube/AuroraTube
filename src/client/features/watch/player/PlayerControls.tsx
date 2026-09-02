import type { QualityOption, StreamSubtitle } from '@shared/types'
import { formatClockDuration } from '@shared/format'
import {
  IconCc,
  IconFullscreen,
  IconFullscreenExit,
  IconPause,
  IconPip,
  IconPipExit,
  IconPlay,
  IconVolume,
  IconVolumeMuted,
} from './icons'
import { PlayerControlButton } from './PlayerControlButton'
import { PlayerSettingsMenu } from './PlayerSettingsMenu'
import { SeekBar } from './SeekBar'

type PlayerControlsProps = {
  visible: boolean
  playing: boolean
  currentTime: number
  duration: number
  buffered: number
  volume: number
  muted: boolean
  isFullscreen: boolean
  isPip?: boolean
  pipSupported?: boolean
  playbackRate: number
  onPlaybackRateChange: (rate: number) => void
  qualities: QualityOption[]
  selectedQualityId?: string
  onQualityChange: (id: string) => void
  subtitles: StreamSubtitle[]
  subtitlesEnabled: boolean
  selectedSubtitleUrl?: string
  onSubtitlesEnabledChange: (enabled: boolean) => void
  onSubtitleChange: (url: string) => void
  onTogglePlay: () => void
  onToggleMute: () => void
  onToggleFullscreen: () => void
  onTogglePictureInPicture?: () => void
  onSeek: (ratio: number) => void
  onBeginSeek: () => void
  onEndSeek: () => void
  onVolume: (v: number) => void
  onMenuOpenChange?: (open: boolean) => void
  /**
   * HLS: no seek / captions / speed.
   * Quality switching remains available via the settings menu.
   */
  hlsRestricted?: boolean
  /** While media is loading — hide interactions. */
  disabled?: boolean
}

export function PlayerControls({
  visible,
  playing,
  currentTime,
  duration,
  buffered,
  volume,
  muted,
  isFullscreen,
  isPip = false,
  pipSupported = false,
  playbackRate,
  onPlaybackRateChange,
  qualities,
  selectedQualityId,
  onQualityChange,
  subtitles,
  subtitlesEnabled,
  selectedSubtitleUrl,
  onSubtitlesEnabledChange,
  onSubtitleChange,
  onTogglePlay,
  onToggleMute,
  onToggleFullscreen,
  onTogglePictureInPicture,
  onSeek,
  onBeginSeek,
  onEndSeek,
  onVolume,
  onMenuOpenChange,
  hlsRestricted = false,
  disabled = false,
}: PlayerControlsProps) {
  const progress = duration > 0 ? currentTime / duration : 0
  const bufferRatio = duration > 0 ? Math.min(1, buffered / duration) : 0
  const qualityLabel =
    qualities.find((q) => q.id === selectedQualityId)?.label?.split(' · ')[0] ??
    qualities[0]?.label?.split(' · ')[0] ??
    ''

  return (
    <div
      data-controls
      className={[
        'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2 pt-10 transition-opacity duration-200',
        visible && !disabled ? 'opacity-100' : 'pointer-events-none opacity-0',
      ].join(' ')}
      onClick={(e) => e.stopPropagation()}
      aria-hidden={disabled || !visible}
    >
      {!hlsRestricted ? (
        <SeekBar
          progress={progress}
          bufferRatio={bufferRatio}
          duration={duration}
          disabled={disabled}
          onSeek={onSeek}
          onBeginSeek={onBeginSeek}
          onEndSeek={onEndSeek}
        />
      ) : (
        <div className="mb-2 h-1" aria-hidden />
      )}

      <div className="flex items-center gap-0.5 text-white sm:gap-1">
        <PlayerControlButton
          label={playing ? '一時停止' : '再生'}
          disabled={disabled}
          onClick={onTogglePlay}
        >
          {playing ? <IconPause /> : <IconPlay />}
        </PlayerControlButton>

        <PlayerControlButton
          label={muted ? 'ミュート解除' : 'ミュート'}
          disabled={disabled}
          onClick={onToggleMute}
        >
          {muted || volume === 0 ? <IconVolumeMuted /> : <IconVolume />}
        </PlayerControlButton>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          aria-label="音量"
          className="hidden w-20 accent-white sm:block"
          disabled={disabled}
          onChange={(e) => onVolume(Number(e.target.value))}
        />

        {!hlsRestricted ? (
          <span className="ml-1 select-none text-xs tabular-nums text-white/90 sm:text-sm">
            {formatClockDuration(currentTime)} / {formatClockDuration(duration)}
          </span>
        ) : null}

        <div className="flex-1" />

        {!hlsRestricted && subtitles.length > 0 ? (
          <PlayerControlButton
            label={subtitlesEnabled ? '字幕をオフ' : '字幕をオン'}
            pressed={subtitlesEnabled}
            disabled={disabled}
            className={subtitlesEnabled ? 'text-white' : 'text-white/50'}
            onClick={() => onSubtitlesEnabledChange(!subtitlesEnabled)}
          >
            <IconCc />
          </PlayerControlButton>
        ) : null}

        {qualities.length > 0 || !hlsRestricted ? (
          <PlayerSettingsMenu
            rate={playbackRate}
            onRateChange={onPlaybackRateChange}
            qualities={qualities}
            selectedQualityId={selectedQualityId}
            onQualityChange={onQualityChange}
            subtitles={subtitles}
            subtitlesEnabled={subtitlesEnabled}
            selectedSubtitleUrl={selectedSubtitleUrl}
            onSubtitlesEnabledChange={onSubtitlesEnabledChange}
            onSubtitleChange={onSubtitleChange}
            onOpenChange={onMenuOpenChange}
            qualityOnly={hlsRestricted}
            disabled={disabled}
          />
        ) : null}

        {qualityLabel ? (
          <span className="hidden rounded bg-white/15 px-1.5 py-0.5 text-[11px] font-medium sm:inline">
            {qualityLabel}
          </span>
        ) : null}

        {pipSupported && onTogglePictureInPicture ? (
          <PlayerControlButton
            label={isPip ? 'ピクチャーインピクチャーを終了' : 'ピクチャーインピクチャー'}
            pressed={isPip}
            disabled={disabled}
            onClick={() => void onTogglePictureInPicture()}
          >
            {isPip ? <IconPipExit /> : <IconPip />}
          </PlayerControlButton>
        ) : null}

        <PlayerControlButton
          label={isFullscreen ? '全画面解除' : '全画面'}
          disabled={disabled}
          onClick={() => void onToggleFullscreen()}
        >
          {isFullscreen ? <IconFullscreenExit /> : <IconFullscreen />}
        </PlayerControlButton>
      </div>
    </div>
  )
}
