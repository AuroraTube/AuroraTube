/**
 * Unified failure classification for provider cascades.
 * - hard_not_found: resource definitively missing (404-style)
 * - soft_failure: transient / provider-local miss (try next)
 * - unexpected: unclassified error treated as soft for cascade, logged as unexpected
 */
export type FailureKind = 'hard_not_found' | 'soft_failure' | 'unexpected'

export type FailureBucket = {
  sawHardNotFound: boolean
  sawSoft: boolean
  lastError: unknown
  lastSoftError: unknown
  failures: Array<{ kind: FailureKind; error: unknown }>
}

/** A provider step that always resolves or throws. */
export type ProviderAttempt<T> = {
  name: string
  run: () => Promise<T>
}

/** Provider that may return null/undefined (miss) instead of throwing. */
export type NullableProviderAttempt<T> = {
  name: string
  run: () => Promise<T | null | undefined>
  /** When true, a strict `null` result is hard_not_found; undefined is always soft. */
  hardNotFoundOnNull?: boolean
}

/** Optional log-message overrides for `firstSuccessfulNullable`. */
export type NullableCascadeEvents = {
  /** Logged when run() returns null/undefined. Default: cascade.provider_miss */
  miss?: string
  /** Logged when accept() rejects a non-null value. Default: cascade.provider_rejected */
  rejected?: string
  /** Logged when run() throws. Default: cascade.provider_failed */
  failed?: string
  /** Logged after every provider failed. Default: cascade.all_failed */
  allFailed?: string
}

/** Shared context passed through to structured cascade logs. */
export type CascadeContext = {
  operation?: string
  id?: string
}
