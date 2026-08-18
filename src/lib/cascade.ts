import { isApiException, notFound, upstreamUnavailable } from './errors'
import { errorFields, logWarn } from './log'

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

export function emptyFailureBucket(): FailureBucket {
  return {
    sawHardNotFound: false,
    sawSoft: false,
    lastError: null,
    lastSoftError: null,
    failures: [],
  }
}

/** Classify a thrown error into a FailureKind. */
export function classifyThrownError(error: unknown): FailureKind {
  if (isApiException(error) && error.code === 'NOT_FOUND') return 'hard_not_found'
  if (isApiException(error)) return 'soft_failure'
  return 'unexpected'
}

/**
 * Record one provider failure into a shared bucket.
 * Prefer classifyThrownError for thrown values; callers may pass an explicit kind
 * when the provider returns null/undefined instead of throwing.
 */
export function noteFailure(
  bucket: FailureBucket,
  error: unknown,
  explicitKind?: FailureKind,
): FailureKind {
  const kind = explicitKind ?? classifyThrownError(error)
  bucket.lastError = error
  bucket.failures.push({ kind, error })

  if (kind === 'hard_not_found') {
    bucket.sawHardNotFound = true
  } else {
    bucket.sawSoft = true
    bucket.lastSoftError = error
  }
  return kind
}

/**
 * Record a provider miss that returned null/undefined instead of throwing.
 * `hardNotFoundOnNull` maps a strict null to hard_not_found; anything else is soft.
 */
export function noteNullMiss(
  bucket: FailureBucket,
  payload: null | undefined,
  hardNotFoundOnNull?: boolean,
): FailureKind {
  const kind: FailureKind =
    payload === null && hardNotFoundOnNull ? 'hard_not_found' : 'soft_failure'
  return noteFailure(bucket, null, kind)
}

/**
 * Resolve final error after all providers failed.
 * NOT_FOUND only when every failure was hard_not_found (no soft mixed in).
 */
export function resolveAllFailed(
  bucket: FailureBucket,
  notFoundMessage: string,
): never {
  if (bucket.sawHardNotFound && !bucket.sawSoft) throw notFound(notFoundMessage)
  if (isApiException(bucket.lastSoftError)) throw bucket.lastSoftError
  if (isApiException(bucket.lastError)) throw bucket.lastError
  throw upstreamUnavailable()
}

export type ProviderAttempt<T> = {
  name: string
  run: () => Promise<T>
}

/**
 * Try providers in order. Soft-fails each until one succeeds.
 * Logs each failure with structured fields for observability.
 */
export async function firstSuccessful<T>(
  providers: Array<(() => Promise<T>) | ProviderAttempt<T>>,
  notFoundMessage: string,
  context?: { operation?: string; id?: string },
): Promise<T> {
  const bucket = emptyFailureBucket()
  const started = Date.now()

  for (let i = 0; i < providers.length; i++) {
    const entry = providers[i]
    const name = typeof entry === 'function' ? `provider:${i}` : entry.name
    const run = typeof entry === 'function' ? entry : entry.run
    const attemptStarted = Date.now()

    try {
      return await run()
    } catch (error) {
      const kind = noteFailure(bucket, error)
      logWarn('cascade.provider_failed', {
        operation: context?.operation,
        id: context?.id,
        provider: name,
        failureKind: kind,
        fallbackDepth: i,
        durationMs: Date.now() - attemptStarted,
        totalDurationMs: Date.now() - started,
        ...errorFields(error),
      })
    }
  }

  logWarn('cascade.all_failed', {
    operation: context?.operation,
    id: context?.id,
    failureCount: bucket.failures.length,
    sawHardNotFound: bucket.sawHardNotFound,
    sawSoft: bucket.sawSoft,
    durationMs: Date.now() - started,
  })

  resolveAllFailed(bucket, notFoundMessage)
}

/** Provider that may return null/undefined (miss) instead of throwing. */
export type NullableProviderAttempt<T> = {
  name: string
  run: () => Promise<T | null | undefined>
  /** When true, a strict `null` result is hard_not_found; undefined is always soft. */
  hardNotFoundOnNull?: boolean
}

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

/**
 * Sequential cascade for providers that signal miss via null/undefined
 * (in addition to throws). Soft/hard semantics match noteNullMiss.
 *
 * `accept` may reject an otherwise non-null value as a soft miss
 * (e.g. StreamPayload with empty qualities).
 */
export async function firstSuccessfulNullable<T>(
  providers: Array<NullableProviderAttempt<T>>,
  notFoundMessage: string,
  context?: { operation?: string; id?: string },
  options?: {
    accept?: (value: T) => boolean
    events?: NullableCascadeEvents
  },
): Promise<T> {
  const bucket = emptyFailureBucket()
  const started = Date.now()
  const accept = options?.accept
  const events = options?.events

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i]
    const attemptStarted = Date.now()

    try {
      const payload = await provider.run()

      if (payload == null) {
        const kind = noteNullMiss(bucket, payload, provider.hardNotFoundOnNull)
        logWarn(events?.miss ?? 'cascade.provider_miss', {
          operation: context?.operation,
          id: context?.id,
          provider: provider.name,
          failureKind: kind,
          fallbackDepth: i,
          durationMs: Date.now() - attemptStarted,
        })
        continue
      }

      if (accept && !accept(payload)) {
        noteFailure(bucket, null, 'soft_failure')
        logWarn(events?.rejected ?? 'cascade.provider_rejected', {
          operation: context?.operation,
          id: context?.id,
          provider: provider.name,
          failureKind: 'soft_failure',
          fallbackDepth: i,
          durationMs: Date.now() - attemptStarted,
        })
        continue
      }

      return payload
    } catch (error) {
      const kind = noteFailure(bucket, error)
      logWarn(events?.failed ?? 'cascade.provider_failed', {
        operation: context?.operation,
        id: context?.id,
        provider: provider.name,
        failureKind: kind,
        fallbackDepth: i,
        durationMs: Date.now() - attemptStarted,
        ...errorFields(error),
      })
    }
  }

  logWarn(events?.allFailed ?? 'cascade.all_failed', {
    operation: context?.operation,
    id: context?.id,
    failureCount: bucket.failures.length,
    sawHardNotFound: bucket.sawHardNotFound,
    sawSoft: bucket.sawSoft,
    durationMs: Date.now() - started,
  })

  resolveAllFailed(bucket, notFoundMessage)
}
