import { badRequest } from '../errors'

/** Require a non-empty trimmed query/path value. */
export function requireParam(value: string | null | undefined, name: string): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) throw badRequest(`Missing query parameter: ${name}`)
  return trimmed
}
