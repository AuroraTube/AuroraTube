/** Shared parsing for fallback stream providers. */

export function parseHeight(label?: string | null): number | undefined {
  if (!label) return undefined
  const m = label.match(/(\d{3,4})\s*p/i) ?? label.match(/^(\d{3,4})$/)
  if (!m) return undefined
  const n = Number(m[1])
  return Number.isFinite(n) && n > 0 ? n : undefined
}

export function guessExt(mime?: string | null): string | undefined {
  if (!mime) return undefined
  const m = mime.toLowerCase()
  if (m.includes('webm')) return 'webm'
  if (m.includes('mp4')) return 'mp4'
  if (m.includes('m4a')) return 'm4a'
  return undefined
}

export function codecFromMime(
  mime: string | null | undefined,
  kind: 'video' | 'audio',
): string | undefined {
  if (!mime) return undefined
  const m = mime.match(/codecs="([^"]+)"/i)
  if (!m) return undefined
  const parts = m[1].split(',').map((s) => s.trim()).filter(Boolean)
  if (!parts.length) return undefined
  if (kind === 'video') return parts[0]
  return parts.length > 1 ? parts[1] : parts[0]
}
