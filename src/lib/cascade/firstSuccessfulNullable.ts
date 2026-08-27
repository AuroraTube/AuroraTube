import { emptyFailureBucket, noteFailure, noteNullMiss, resolveAllFailed } from './failureBucket'
import { logCascadeExhausted, logProviderEvent } from './logging'
import type { CascadeContext, NullableCascadeEvents, NullableProviderAttempt } from './types'

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
  context?: CascadeContext,
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
        logProviderEvent({
          message: events?.miss ?? 'cascade.provider_miss',
          context,
          provider: provider.name,
          failureKind: kind,
          fallbackDepth: i,
          startedAt: attemptStarted,
        })
        continue
      }

      if (accept && !accept(payload)) {
        noteFailure(bucket, null, 'soft_failure')
        logProviderEvent({
          message: events?.rejected ?? 'cascade.provider_rejected',
          context,
          provider: provider.name,
          failureKind: 'soft_failure',
          fallbackDepth: i,
          startedAt: attemptStarted,
        })
        continue
      }

      return payload
    } catch (error) {
      const kind = noteFailure(bucket, error)
      logProviderEvent({
        message: events?.failed ?? 'cascade.provider_failed',
        context,
        provider: provider.name,
        failureKind: kind,
        fallbackDepth: i,
        startedAt: attemptStarted,
        error,
      })
    }
  }

  logCascadeExhausted({
    message: events?.allFailed ?? 'cascade.all_failed',
    context,
    bucket,
    startedAt: started,
  })
  resolveAllFailed(bucket, notFoundMessage)
}
