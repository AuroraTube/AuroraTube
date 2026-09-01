import type { ReactNode } from 'react'
import { ErrorBanner } from '@/components/feedback'
import { WatchPlayer } from './WatchPlayer'
import type { PlaybackSelection } from './usePlaybackSelection'

type Props = {
  streamReady: boolean
  streamError: string | null
  streamLoading: boolean
  onRetry: () => void
  playback: PlaybackSelection
}

function PlayerShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative -mx-3 overflow-hidden bg-black sm:mx-0 sm:rounded-xl">
      <div className="relative flex aspect-video items-center justify-center">{children}</div>
    </div>
  )
}

/** Stream/player region — fixed 16:9 frame for loading / error / player. */
export function WatchStreamArea({
  streamReady,
  streamError,
  streamLoading,
  onRetry,
  playback,
}: Props) {
  if (streamError && !streamReady) {
    return (
      <PlayerShell>
        <div className="max-w-md px-4">
          <ErrorBanner message={streamError} onRetry={onRetry} />
        </div>
      </PlayerShell>
    )
  }

  if (streamLoading && !streamReady) {
    return (
      <PlayerShell>
        <p className="text-sm text-white/70">ストリームを読み込み中…</p>
      </PlayerShell>
    )
  }

  return (
    <WatchPlayer
      quality={playback.selectedQuality}
      qualities={playback.qualities}
      onQualityChange={playback.setSelectedQualityId}
      subtitles={playback.subtitles}
      selectedSubtitle={playback.selectedSubtitle}
      subtitlesEnabled={playback.subtitlesEnabled}
      onSubtitlesEnabledChange={playback.setSubtitlesEnabled}
      onSubtitleChange={playback.setSelectedSubtitleUrl}
    />
  )
}
