/** Format media duration as H:MM:SS or M:SS. */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Parse clock strings (`M:SS` / `H:MM:SS`). Non-clock labels (e.g. `新着`) return text only.
 */
export function parseClockDuration(raw: string | undefined | null): {
  durationText?: string
  durationSeconds?: number
} {
  if (raw == null) return {}
  const t = String(raw).trim()
  if (!t) return {}
  if (/^\d+:\d{2}(:\d{2})?$/.test(t)) {
    const parts = t.split(':').map(Number)
    let seconds = 0
    for (const p of parts) {
      if (!Number.isFinite(p)) return { durationText: t }
      seconds = seconds * 60 + p
    }
    return { durationText: t, durationSeconds: seconds }
  }
  return { durationText: t }
}
