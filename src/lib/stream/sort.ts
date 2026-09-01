import type { QualityOption } from '../../shared/types'

/**
 * Progressive before HLS; adaptive HLS before fixed; height desc; muxed preferred.
 * Shared by SiaTube and RapidAPI quality builders.
 */
function compareQualityOptions(a: QualityOption, b: QualityOption): number {
  if (a.isHls !== b.isHls) return a.isHls ? 1 : -1
  if (a.isHls && b.isHls) {
    if (Boolean(a.isAdaptiveHls) !== Boolean(b.isAdaptiveHls)) {
      return a.isAdaptiveHls ? -1 : 1
    }
  }
  const ha = a.height ?? 0
  const hb = b.height ?? 0
  if (hb !== ha) return hb - ha
  if (a.isMuxed !== b.isMuxed) return a.isMuxed ? -1 : 1
  return 0
}

export function sortQualityOptions(options: QualityOption[]): QualityOption[] {
  return [...options].sort(compareQualityOptions)
}
