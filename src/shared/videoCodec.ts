/**
 * Progressive codec preference shared by stream normalization (worker)
 * and default quality selection (client).
 *
 * Prefer AVC/MP4 for broad browser compatibility over VP9/WebM and AV1.
 */

type CodecKind = 'avc' | 'vp9' | 'av1' | 'unknown'

function detectCodecKind(vcodec?: string | null, ext?: string | null): CodecKind {
  const c = (vcodec ?? '').toLowerCase()
  const e = (ext ?? '').toLowerCase()
  if (e === 'mp4' || c.startsWith('avc') || c.includes('avc1')) return 'avc'
  if (c.startsWith('vp9') || c.includes('vp09') || e === 'webm') return 'vp9'
  if (c.startsWith('av01') || c.startsWith('av1')) return 'av1'
  return 'unknown'
}

/** Higher is better. Gaps dominate typical bitrate differences. */
export function codecRank(vcodec?: string | null, ext?: string | null): number {
  switch (detectCodecKind(vcodec, ext)) {
    case 'avc':
      return 3_000_000
    case 'vp9':
      return 2_000_000
    case 'av1':
      return 1_000_000
    default:
      return 0
  }
}

export function isAvcLike(vcodec?: string | null, ext?: string | null): boolean {
  return detectCodecKind(vcodec, ext) === 'avc'
}
