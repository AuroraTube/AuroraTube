/** Invidious VideoObject badge flags (LIVE / PREMIERE / Premium). */
import type { RecordLike } from '../parse'

export function collectBadges(item: RecordLike): string[] | undefined {
  const badges: string[] = []
  if (item.liveNow === true) badges.push('LIVE')
  if (item.isUpcoming === true) badges.push('PREMIERE')
  if (item.premium === true) badges.push('Premium')
  return badges.length ? badges : undefined
}
