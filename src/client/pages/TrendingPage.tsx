import { useCallback } from 'react'
import type { TrendingResponse } from '@shared/types'
import { apiGet } from '@/lib/api'
import { useApiResource } from '@/hooks/useApiResource'
import { RetryButton, SectionHeader } from '@/components/feedback'
import { VideoGrid } from '@/components/media'
import { VideoGridSkeleton } from '@/components/skeletons'
import { AsyncView } from '@/components/asyncView'

export function TrendingPage() {
  const loader = useCallback(
    (signal: AbortSignal) =>
      apiGet<TrendingResponse>('/api/trending', { signal }),
    [],
  )
  const state = useApiResource<TrendingResponse>({
    key: 'trending',
    loader,
  })

  return (
    <div className="space-y-6">
      <SectionHeader title="トレンド" action={<RetryButton onRetry={state.reload} />} />
      <AsyncView state={state} onRetry={state.reload} loading={<VideoGridSkeleton count={12} />}>
        {(data) => <VideoGrid videos={data.videos} />}
      </AsyncView>
    </div>
  )
}
