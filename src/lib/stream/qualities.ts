import type { QualityOption } from '../../shared/types'
import type { InternalStreamEntry } from './internalEntry'
import { buildHlsOptions } from './hls'
import { buildProgressiveOptions } from './progressive'
import { sortQualityOptions } from './sort'

/** Progressive first (VOD), then HLS (live). */
export function buildQualityOptions(
  muxed: InternalStreamEntry[],
  videoOnly: InternalStreamEntry[],
  audioTracks: InternalStreamEntry[],
  hlsEntries: InternalStreamEntry[],
): QualityOption[] {
  return sortQualityOptions([
    ...buildProgressiveOptions(muxed, videoOnly, audioTracks),
    ...buildHlsOptions(hlsEntries),
  ])
}
