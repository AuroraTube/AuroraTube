/**
 * Classify upstream JSON error payloads without throwing.
 * Used by SiaTube metadata fetch, SiaTube stream fetch, and Invidious requestJson.
 */

export type BodyFailureKind = 'not_found' | 'rate_limited' | 'unavailable' | 'bad_response'

const HARD_NOT_FOUND =
  /not found|deleted|private|removed|terminated|copyright/i
const SOFT_RATE = /rate.?limit|too many|status\s*429|\b429\b/i
const SOFT_UNAVAILABLE =
  /service unavailable|temporarily|try again|timeout|upstream/i

/** Classify a free-form error message (+ optional machine code). */
export function classifyErrorText(
  message: string,
  code?: string | null,
): BodyFailureKind {
  const c = (code ?? '').toLowerCase()
  if (c === 'deleted' || c === 'private') return 'not_found'
  if (c === 'rate_limited') return 'rate_limited'
  if (SOFT_RATE.test(message)) return 'rate_limited'
  if (HARD_NOT_FOUND.test(message)) return 'not_found'
  if (c === 'unavailable' || SOFT_UNAVAILABLE.test(message)) return 'unavailable'
  return 'bad_response'
}

/**
 * SiaTube / similar providers: HTTP 200 with error or unavailable fields.
 * Returns null when the body looks like a normal success payload.
 */
export function classifyJsonBody(raw: unknown): BodyFailureKind | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const obj = raw as Record<string, unknown>

  if ('error' in obj) {
    const code = obj.code != null ? String(obj.code) : null
    const message = String(obj.message ?? obj.error ?? 'Upstream error')
    return classifyErrorText(message, code)
  }

  if (obj.unavailable === true) {
    const reason = String(obj.reason ?? 'unavailable')
    return classifyErrorText(reason)
  }

  return null
}
