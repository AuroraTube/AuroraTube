import type { ReactNode } from 'react'
import type { ApiResourceState } from '@/hooks/useApiResource'
import { ErrorBanner, InlineStatus } from '@/components/feedback'

type AsyncViewProps<T> = {
  state: ApiResourceState<T>
  children: (data: T) => ReactNode
  empty?: ReactNode
  /** Custom loading UI (e.g. skeleton). Falls back to InlineStatus. */
  loading?: ReactNode
  loadingLabel?: ReactNode
  onRetry?: () => void
}

/**
 * loading → error → data.
 * Loading wins over a cleared/stale error so retry shows progress.
 */
export function AsyncView<T>({
  state,
  children,
  empty = null,
  loading,
  loadingLabel = '読み込み中…',
  onRetry,
}: AsyncViewProps<T>) {
  if (state.loading && !state.data) {
    if (loading != null) return <>{loading}</>
    return (
      <div className="rounded-xl border border-line bg-white p-6">
        <InlineStatus>{loadingLabel}</InlineStatus>
      </div>
    )
  }

  if (state.error && !state.data) {
    return <ErrorBanner message={state.error} onRetry={onRetry} />
  }

  if (!state.data) return <>{empty}</>
  return <>{children(state.data)}</>
}
