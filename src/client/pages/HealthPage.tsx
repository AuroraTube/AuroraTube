import { useCallback } from 'react'
import type { HealthResponse } from '@shared/types'
import { apiGet } from '@/lib/api'
import { useApiResource } from '@/hooks/useApiResource'
import { RetryButton } from '@/components/feedback'

export function HealthPage() {
  const loader = useCallback(
    (signal: AbortSignal) =>
      apiGet<HealthResponse>('/api/health', { signal }),
    [],
  )
  const state = useApiResource<HealthResponse>({
    key: 'health',
    loader,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Health</h1>
        <RetryButton onRetry={state.reload} />
      </div>
      <pre className="overflow-x-auto rounded-xl bg-chip p-4 text-sm text-ink">
        {state.data
          ? JSON.stringify(state.data, null, 2)
          : state.loading
            ? '読み込み中…'
            : (state.error ?? 'No data')}
      </pre>
    </div>
  )
}
