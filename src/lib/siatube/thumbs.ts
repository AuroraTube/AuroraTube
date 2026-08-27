import type { Thumbnail } from '../../shared/types'
import { asArray, asString, isRecord, mapDefined } from '../parse'

export function thumbFromUnknown(value: unknown): Thumbnail[] {
  if (Array.isArray(value)) {
    return mapDefined(value, (item) => {
      if (typeof item === 'string') {
        const url = asString(item)
        return url ? { url } : null
      }
      if (!isRecord(item)) return null
      const url = asString(item.url)
      if (!url) return null
      return { url }
    })
  }
  if (isRecord(value)) {
    const url = asString(value.url)
    if (url) return [{ url }]
  }
  if (typeof value === 'string') {
    const url = asString(value)
    if (url) return [{ url }]
  }
  return []
}

export function firstNonEmptyThumbs(...candidates: unknown[]): Thumbnail[] {
  for (const c of candidates) {
    const thumbs = thumbFromUnknown(c)
    if (thumbs.length) return thumbs
  }
  return []
}
