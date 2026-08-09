import { badRequest } from '../errors'
import { hasControlChars } from './chars'

/** Max length for opaque continuation tokens (Invidious / provider-specific). */
const MAX_CONTINUATION_LENGTH = 16_384

/** Invidious continuation tokens (opaque, length-capped). */
export function validateContinuation(value: string | null | undefined): string | undefined {
  if (value == null) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (trimmed.length > MAX_CONTINUATION_LENGTH) throw badRequest('Invalid continuation')
  if (hasControlChars(trimmed)) throw badRequest('Invalid continuation')
  return trimmed
}
