import type { QualityOption } from '../../../../shared/types'
import { asArray, asNumber, asString, isRecord } from '../../../parse'
import { isSafeMediaUrl } from '../../url'
import { muxedQualityFromUrl } from '../fromUrl'
import { codecFromMime, guessExt, parseHeight } from '../mediaMeta'
import { formatIdOf } from './helpers'

/** Progressive muxed entries from RapidAPI `formats[]`. */
export function collectMuxedQualities(raw: Record<string, unknown>): QualityOption[] {
  const out: QualityOption[] = []

  for (const item of asArray(raw.formats)) {
    if (!isRecord(item)) continue
    const url = asString(item.url)
    if (!url || !isSafeMediaUrl(url)) continue

    const mime = asString(item.mimeType) ?? asString(item.mime)
    const height =
      asNumber(item.height) ??
      parseHeight(asString(item.qualityLabel) ?? asString(item.quality))

    const q = muxedQualityFromUrl({
      url,
      height: height ?? undefined,
      width: asNumber(item.width),
      fps: asNumber(item.fps),
      formatId: formatIdOf(item),
      formatNote: asString(item.qualityLabel) ?? asString(item.quality),
      ext: guessExt(mime) ?? 'mp4',
      vcodec: codecFromMime(mime, 'video'),
      acodec: codecFromMime(mime, 'audio'),
      bitrate: asNumber(item.bitrate) ?? asNumber(item.averageBitrate),
    })
    if (q) out.push(q)
  }

  return out
}
