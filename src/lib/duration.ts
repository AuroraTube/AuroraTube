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
