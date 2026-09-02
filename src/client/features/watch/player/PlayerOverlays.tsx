import { IconPlay, IconRefresh } from './icons'

/** Spinner shown while the media is buffering and has not yet errored. */
export function LoadingOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/35">
      <div
        className="h-12 w-12 animate-spin rounded-full border-2 border-white/25 border-t-white"
        role="status"
        aria-label="読み込み中"
      />
    </div>
  )
}

type SourceErrorOverlayProps = {
  onReload: () => void
}

/** Shown when the video source failed to load and gave up auto-recovering. */
export function SourceErrorOverlay({ onReload }: SourceErrorOverlayProps) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/70 px-4 text-center">
      <p className="text-sm text-white/80">動画を読み込めませんでした</p>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onReload()
        }}
        className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/25 active:bg-white/30"
      >
        <IconRefresh className="h-4 w-4" />
        再読み込み
      </button>
    </div>
  )
}

/** Centered play glyph shown while paused, not loading, and not errored. */
export function PlayHintOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm">
        <IconPlay className="ml-1 h-8 w-8" />
      </div>
    </div>
  )
}

/** Replaces the whole player when there is no playable source at all. */
export function NoSourcePlaceholder() {
  return (
    <div className="relative -mx-3 overflow-hidden bg-black sm:mx-0 sm:rounded-xl">
      <div className="flex aspect-video items-center justify-center text-white/55">
        再生 URL がありません。
      </div>
    </div>
  )
}
