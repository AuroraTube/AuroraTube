/**
 * Provider cascade helpers: run a sequence of upstream providers, soft-failing
 * each one until a result is found, with unified failure classification and
 * structured logging.
 *
 * - types.ts: shared type definitions
 * - failureBucket.ts: per-run failure bookkeeping + final-error resolution
 * - logging.ts: structured log helpers shared by both cascade runners
 * - firstSuccessful.ts: cascade for providers that always resolve or throw
 * - firstSuccessfulNullable.ts: cascade for providers that may miss via null/undefined
 */
export type {
  CascadeContext,
  FailureBucket,
  FailureKind,
  NullableCascadeEvents,
  NullableProviderAttempt,
  ProviderAttempt,
} from './types'
export {
  classifyThrownError,
  emptyFailureBucket,
  noteFailure,
  noteNullMiss,
  resolveAllFailed,
} from './failureBucket'
export { firstSuccessful } from './firstSuccessful'
export { firstSuccessfulNullable } from './firstSuccessfulNullable'
