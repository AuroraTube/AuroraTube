import type { TrendingResponse } from '../../shared/types'
import { isRecord, mapDefined } from '../parse'
import { detectKind } from './search'
import { toVideoSummary } from './video'

export function normalizeTrending(source: unknown): TrendingResponse {
  const candidates = Array.isArray(source) ? source : []

  const videos = mapDefined(candidates, (item) => {
    if (!isRecord(item) || detectKind(item) !== 'video') return null
    const summary = toVideoSummary(item)
    return summary.id ? summary : null
  })

  return { videos }
}
