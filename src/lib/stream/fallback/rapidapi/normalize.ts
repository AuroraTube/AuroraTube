import type { QualityOption, StreamPayload } from '../../../../shared/types'
import { isRecord } from '../../../parse'
import { sortQualityOptions } from '../../sort'
import { collectAdaptiveQualities } from './adaptive'
import { collectRapidCaptions } from './captions'
import { isProviderError } from './helpers'
import { collectMuxedQualities } from './formats'
import { collectHlsQuality } from './hls'

/**
 * Normalize RapidAPI YTStream `/dl` JSON → StreamPayload (official schema only).
 *
 * Reads: status, formats, adaptiveFormats, hlsManifestUrl, captions.
 * Metadata (id/title) is dropped — use the watch API.
 */
export function normalizeRapidApiStream(raw: unknown): StreamPayload | null {
  if (!isRecord(raw)) return null
  if (isProviderError(raw)) return null

  const qualities: QualityOption[] = [
    ...collectMuxedQualities(raw),
    ...collectAdaptiveQualities(raw),
  ]
  const hls = collectHlsQuality(raw)
  if (hls) qualities.push(hls)

  const sorted = sortQualityOptions(qualities)
  if (!sorted.length) return null

  return {
    qualities: sorted,
    subtitles: collectRapidCaptions(raw.captions),
  }
}
