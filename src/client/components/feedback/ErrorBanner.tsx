import { RetryButton } from './RetryButton'

/** Error message + optional retry — used by AsyncView, WatchPage, comments, etc. */
export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-red-700">{message}</p>
      {onRetry ? <RetryButton onRetry={onRetry} /> : null}
    </div>
  )
}
