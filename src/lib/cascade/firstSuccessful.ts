import { emptyFailureBucket, noteFailure, resolveAllFailed } from './failureBucket'
import { logCascadeExhausted, logProviderEvent } from './logging'
import type { CascadeContext, ProviderAttempt } from './types'

/**
 * Try providers in order. Soft-fails each until one succeeds.
 * Logs each failure with structured fields for observability.
 */
export async function firstSuccessful<T>(
  providers: Array<(() => Promise<T>) | ProviderAttempt<T>>,
  notFoundMessage: string,
  context?: CascadeContext,
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
      logProviderEvent({
        message: 'cascade.provider_failed',
        context,
        provider: name,
        failureKind: kind,
        fallbackDepth: i,
        startedAt: attemptStarted,
        cascadeStartedAt: started,
        error,
      })
    }
  }

  logCascadeExhausted({ message: 'cascade.all_failed', context, bucket, startedAt: started })
  resolveAllFailed(bucket, notFoundMessage)
}
