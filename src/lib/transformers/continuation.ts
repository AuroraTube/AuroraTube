import { asString, type RecordLike } from '../parse'

/** Invidious continuation field only. @see https://docs.invidious.io/api/ */
export function continuationFrom(root: RecordLike): string | undefined {
  return asString(root.continuation)
}
