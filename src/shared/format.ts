/**
 * Format a duration/clock value in seconds as `H:MM:SS` or `M:SS`.
 * Shared by server transformers (video duration) and the client player
 * (playback clock) so the two never drift.
 */
export function formatClockDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds)) return '0:00'
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Compact number formatting shared by server transformers and client UI.
 * Locale fixed to ja-JP for consistent display strings.
 */
export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value)
  try {
    return new Intl.NumberFormat('ja-JP', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  } catch {
    return String(value)
  }
}
