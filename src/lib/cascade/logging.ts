import { errorFields, logWarn } from '../log'
import type { CascadeContext, FailureBucket, FailureKind } from './types'

/** Log a single provider attempt outcome (failure, miss, or reject). */
export function logProviderEvent(params: {
  message: string
  context?: CascadeContext
  provider: string
  failureKind: FailureKind
  fallbackDepth: number
  startedAt: number
  /** Optional: time since the cascade itself started (not just this attempt). */
  cascadeStartedAt?: number
  error?: unknown
}): void {
  const { message, context, provider, failureKind, fallbackDepth, startedAt, cascadeStartedAt, error } =
    params
  logWarn(message, {
    operation: context?.operation,
    id: context?.id,
    provider,
    failureKind,
    fallbackDepth,
    durationMs: Date.now() - startedAt,
    ...(cascadeStartedAt !== undefined ? { totalDurationMs: Date.now() - cascadeStartedAt } : {}),
    ...(error !== undefined ? errorFields(error) : {}),
  })
}

/** Log the terminal "every provider failed" event for a cascade run. */
export function logCascadeExhausted(params: {
  message: string
  context?: CascadeContext
  bucket: FailureBucket
  startedAt: number
}): void {
  const { message, context, bucket, startedAt } = params
  logWarn(message, {
    operation: context?.operation,
    id: context?.id,
    failureCount: bucket.failures.length,
    sawHardNotFound: bucket.sawHardNotFound,
    sawSoft: bucket.sawSoft,
    durationMs: Date.now() - startedAt,
  })
}
