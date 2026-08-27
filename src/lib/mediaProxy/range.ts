/**
 * Validate an HTTP Range request header before forwarding upstream.
 * Rejects empty, oversized, or non-bytes unit values to limit abuse.
 */

import { hasControlChars } from '../validate/chars'

const MAX_RANGE_HEADER_LENGTH = 128
/** RFC 7233 bytes unit, single or suffix range. */
const BYTES_RANGE_RE =
  /^bytes=(?:\d+-\d*|\d*-\d+)(?:,\s*(?:\d+-\d*|\d*-\d+)){0,4}$/i

/**
 * Return a sanitized Range header value, or null if absent / invalid.
 * Invalid values are dropped (full response) rather than failing the request.
 */
export function sanitizeRangeHeader(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const value = raw.trim()
  if (!value) return null
  if (value.length > MAX_RANGE_HEADER_LENGTH) return null
  if (hasControlChars(value)) return null
  if (!BYTES_RANGE_RE.test(value)) return null
  return value
}
