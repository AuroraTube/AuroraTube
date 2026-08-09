import { asString, firstString, isRecord, type RecordLike } from '../parse'
import { handleFromUrl, resolveAvatar } from './shared'

/** Invidious author identity fields only. @see https://docs.invidious.io/api/common_types/ */

export function authorAvatarFrom(item: RecordLike): string | undefined {
  return resolveAvatar(item.authorThumbnails)
}

export function authorIdFrom(item: RecordLike): string | undefined {
  return asString(item.authorId)
}

export function authorNameFrom(item: RecordLike, fallback = 'Unknown'): string {
  return firstString(item.author) ?? fallback
}

/** Derive handle from authorUrl path when present (no dedicated handle field in schema). */
export function authorHandleFrom(item: RecordLike): string | undefined {
  return handleFromUrl(item.authorUrl)
}

export function asRecord(source: unknown): RecordLike {
  return isRecord(source) ? source : {}
}
