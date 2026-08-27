import type { InternalStreamEntry } from './internalEntry'

export type QualityKind = 'muxed' | 'split' | 'hls' | 'hls-auto'

export function qualityLabel(entry: InternalStreamEntry, kind: QualityKind): string {
  if (kind === 'hls-auto') return '自動 · HLS'

  const note = entry.formatNote?.replace(/\s*\(.*\)\s*$/, '').trim()
  const fromFormat = note?.match(/(\d+p|\d+x\d+)/i)?.[1]
  const res =
    (entry.height ? `${entry.height}p` : undefined) ||
    fromFormat ||
    note ||
    (entry.width && entry.height ? `${entry.width}×${entry.height}` : undefined) ||
    (kind === 'hls' ? 'HLS' : undefined) ||
    entry.formatId ||
    'unknown'

  const parts = [res]
  if (entry.fps && entry.fps > 30) parts.push(`${entry.fps}fps`)
  if (kind === 'hls') parts.push('HLS')
  else if (kind === 'muxed') parts.push('muxed')
  else if (kind === 'split' && entry.vcodec) {
    const codec = entry.vcodec.split('.')[0]
    if (codec && codec !== 'none') parts.push(codec)
  }
  return parts.join(' · ')
}
