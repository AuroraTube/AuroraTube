import type { ReactNode } from 'react'
import type { QualityOption, StreamSubtitle } from '@shared/types'
import { ErrorBanner } from '@/components/feedback'
import { WatchPlayer } from './WatchPlayer'

type Playback = {
  selectedQuality?: QualityOption
  qualities: QualityOption[]
  setSelectedQualityId: (id: string) => void
  subtitles: StreamSubtitle[]
  selectedSubtitle?: StreamSubtitle
  subtitlesEnabled: boolean
  setSubtitlesEnabled: (v: boolean) => void
  setSelectedSubtitleUrl: (url: string) => void
}

type Props = {
  streamReady: boolean
  streamError: string | null
  streamLoading: boolean
  onRetry: () => void
  playback: Playback
}

/** Fixed 16:9 shell so loading / error / player never change the video frame size. */
function PlayerShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative -mx-3 overflow-hidden bg-black sm:mx-0 sm:rounded-xl">
      <div className="relative flex aspect-video items-center justify-center">{children}</div>
    </div>
  )
}

/**
 * Stream/player region of the watch page.
 * Isolates loading / error / player mounting from metadata layout.
 * Always occupies a 16:9 frame so the page does not jump when stream resolves.
 */
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
          <ErrorBanner
            message={`ストリーム取得に失敗しました: ${streamError}`}
            onRetry={onRetry}
          />
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
