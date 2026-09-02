import type { SeekFlash as SeekFlashState } from './usePlayerTapGestures'

export function SeekFlashOverlay({ flash }: { flash: SeekFlashState }) {
  if (!flash) return null
  const isLeft = flash.side === 'left'
  return (
    <div
      key={flash.id}
      className={`pointer-events-none absolute inset-y-0 flex w-1/3 items-center justify-center ${
        isLeft ? 'left-0' : 'right-0'
      }`}
      aria-hidden
    >
      <div className="flex animate-pulse flex-col items-center gap-1 rounded-full bg-black/55 px-4 py-3 text-white shadow-lg backdrop-blur-sm">
        <span className="text-lg font-semibold tracking-tight">
          {isLeft ? `−${flash.seconds}` : `+${flash.seconds}`}
        </span>
        <span className="text-[11px] uppercase tracking-wider text-white/80">秒</span>
      </div>
    </div>
  )
}
