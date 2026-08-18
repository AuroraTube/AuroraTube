import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { formatTime } from './formatTime'

type SeekBarProps = {
  progress: number
  bufferRatio: number
  /** Total media duration in seconds — used for hover time preview. */
  duration: number
  disabled?: boolean
  onSeek: (ratio: number) => void
  onBeginSeek: () => void
  onEndSeek: () => void
}

function clampRatio(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

/** Scrubber: buffer track + played track + drag handle + hover time tooltip. */
export function SeekBar({
  progress,
  bufferRatio,
  duration,
  disabled = false,
  onSeek,
  onBeginSeek,
  onEndSeek,
}: SeekBarProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const [hover, setHover] = useState<{ ratio: number; x: number } | null>(null)

  const ratioFromClientX = useCallback((clientX: number) => {
    const el = barRef.current
    if (!el) return 0
    const rect = el.getBoundingClientRect()
    return clampRatio((clientX - rect.left) / Math.max(1, rect.width))
  }, [])

  const updateHover = useCallback(
    (clientX: number) => {
      if (disabled || duration <= 0) {
        setHover(null)
        return
      }
      const el = barRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const ratio = ratioFromClientX(clientX)
      setHover({ ratio, x: ratio * rect.width })
    },
    [disabled, duration, ratioFromClientX],
  )

  const onBarPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    draggingRef.current = true
    onBeginSeek()
    const ratio = ratioFromClientX(e.clientX)
    onSeek(ratio)
    updateHover(e.clientX)
  }

  const onBarPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) {
      onSeek(ratioFromClientX(e.clientX))
    }
    updateHover(e.clientX)
  }

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    draggingRef.current = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    onEndSeek()
  }

  const clearHover = () => {
    if (!draggingRef.current) setHover(null)
  }

  const hoverLabel =
    hover && duration > 0 ? formatTime(hover.ratio * duration) : null

  return (
    <div
      ref={barRef}
      className="group/bar relative mb-2 h-1 cursor-pointer rounded-full bg-white/25 hover:h-1.5"
      onPointerDown={onBarPointerDown}
      onPointerMove={onBarPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={clearHover}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-white/35"
        style={{ width: `${bufferRatio * 100}%` }}
      />
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-red-600"
        style={{ width: `${progress * 100}%` }}
      />
      <div
        className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-red-600 opacity-0 shadow group-hover/bar:opacity-100"
        style={{ left: `calc(${progress * 100}% - 6px)` }}
      />

      {hoverLabel && hover ? (
        <div
          className="pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2 select-none whitespace-nowrap rounded bg-black/85 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white shadow"
          style={{ left: hover.x }}
          role="tooltip"
        >
          {hoverLabel}
        </div>
      ) : null}
    </div>
  )
}
