/**
 * SiaTube scalar field helpers (verified against live /api/video).
 *
 * - description: { text, formatted, run0, ... } or string
 * - likes: display string e.g. "1931万"
 * - views: display string e.g. "18億回視聴"
 * - localViews: number (instance-local, not YouTube total)
 */
import { asNumber, asString, firstString, isRecord } from '../parse'
import { parseLooseCount } from '../parseCount'

export function descriptionFrom(source: Record<string, unknown>): string | undefined {
  const description = source.description
  if (typeof description === 'string') return asString(description)
  if (isRecord(description)) {
    return firstString(description.text)
  }
  return undefined
}

export function likeCountFrom(source: Record<string, unknown>): number | undefined {
  if (typeof source.likes === 'string') return parseLooseCount(source.likes)
  if (typeof source.likes === 'number') return asNumber(source.likes)
  return undefined
}

export function viewsFrom(source: Record<string, unknown>): number | undefined {
  return parseLooseCount(asString(source.views) ?? '')
}
