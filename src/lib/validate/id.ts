import { badRequest } from '../errors'

/**
 * Shared validator for opaque upstream ids (channel / playlist).
 * Alphanumeric + _- only — blocks path separators and traversal tokens.
 */
export function validateOpaqueId(
  value: string,
  field: string,
  maxLength = 128,
): string {
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > maxLength) throw badRequest(`Invalid ${field}`)
  if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) throw badRequest(`Invalid ${field}`)
  return trimmed
}
