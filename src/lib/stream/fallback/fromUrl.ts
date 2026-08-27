import type { QualityOption } from '../../../shared/types'
import type { InternalStreamEntry } from '../internalEntry'
import { isSafeMediaUrl } from '../url'
import { qualityLabel } from '../label'
import { toPublicEntry } from '../slim'

/** Build a single muxed progressive quality option. */
export function muxedQualityFromUrl(opts: {
  url: string
  height?: number
  width?: number
  fps?: number
  formatId?: string
  formatNote?: string
  ext?: string
  vcodec?: string
  acodec?: string
  bitrate?: number
}): QualityOption | null {
  if (!opts.url || !isSafeMediaUrl(opts.url)) return null
  const entry: InternalStreamEntry = {
    url: opts.url,
    mediaType: 'muxed',
    formatId: opts.formatId,
    formatNote: opts.formatNote,
    ext: opts.ext ?? 'mp4',
    width: opts.width,
    height: opts.height,
    fps: opts.fps,
    vcodec: opts.vcodec,
    acodec: opts.acodec,
    bitrate: opts.bitrate,
  }
  const out: QualityOption = {
    id: `muxed:${opts.formatId ?? opts.height ?? opts.url}`,
    label: qualityLabel(entry, 'muxed'),
    isMuxed: true,
    isHls: false,
    video: toPublicEntry(entry),
  }
  if (opts.height != null) out.height = opts.height
  return out
}
