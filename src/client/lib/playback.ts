import type { QualityOption } from '@shared/types'
import { isAvcLike } from '@shared/videoCodec'

function optionIsAvc(q: QualityOption): boolean {
  return isAvcLike(q.video?.vcodec, q.video?.ext)
}

function closestToTarget(options: QualityOption[], target: number): QualityOption | undefined {
  if (!options.length) return undefined
  return [...options].sort((a, b) => {
    const da = Math.abs((a.height ?? 0) - target)
    const db = Math.abs((b.height ?? 0) - target)
    if (da !== db) return da - db
    if (a.isMuxed !== b.isMuxed) return a.isMuxed ? -1 : 1
    const aAvc = optionIsAvc(a)
    const bAvc = optionIsAvc(b)
    if (aAvc !== bAvc) return aAvc ? -1 : 1
    return (b.height ?? 0) - (a.height ?? 0)
  })[0]
}

/**
 * Default quality from stream options.
 * VOD: progressive muxed → AVC split → other split. Live: fixed HLS → adaptive.
 */
export function pickPreferredQuality(qualities: QualityOption[]): QualityOption | undefined {
  if (!qualities.length) return undefined

  const target = 720
  const progressive = qualities.filter((q) => !q.isHls)
  const muxed = progressive.filter((q) => q.isMuxed)
  const split = progressive.filter((q) => !q.isMuxed)

  if (muxed.length) {
    const good = muxed.filter((q) => (q.height ?? 0) >= 360)
    return closestToTarget(good.length ? good : muxed, target)
  }
  if (split.length) {
    const avc = split.filter(optionIsAvc)
    return closestToTarget(avc.length ? avc : split, target)
  }

  const fixedHls = qualities.filter((q) => q.isHls && !q.isAdaptiveHls)
  if (fixedHls.length) return closestToTarget(fixedHls, target)

  return (
    qualities.find((q) => q.isHls && q.isAdaptiveHls) ??
    qualities.find((q) => q.isHls) ??
    qualities[0]
  )
}
