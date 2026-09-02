import { isApiException, notFound, upstreamUnavailable } from '../errors'
import type { FailureBucket, FailureKind } from './types'

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
  payload: unknown,
  hardNotFoundOnNull?: boolean,
): FailureKind {
  const kind: FailureKind = payload === null && hardNotFoundOnNull ? 'hard_not_found' : 'soft_failure'
  return noteFailure(bucket, null, kind)
}

/**
 * Resolve final error after all providers failed.
 * NOT_FOUND only when every failure was hard_not_found (no soft mixed in).
 */
export function resolveAllFailed(bucket: FailureBucket, notFoundMessage: string): never {
  if (bucket.sawHardNotFound && !bucket.sawSoft) throw notFound(notFoundMessage)
  if (isApiException(bucket.lastSoftError)) throw bucket.lastSoftError
  if (isApiException(bucket.lastError)) throw bucket.lastError
  throw upstreamUnavailable()
}
