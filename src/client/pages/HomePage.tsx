import { useCallback, useMemo } from 'react'
import type { TrendingResponse } from '@shared/types'
import { apiGet } from '@/lib/api'
import { useApiResource } from '@/hooks/useApiResource'
import { RecentVideos, VideoGrid } from '@/components/media'
import { SectionHeader } from '@/components/feedback'
import { VideoGridSkeleton } from '@/components/skeletons'
import { readRecentVideos } from '@/lib/recentVideos'
import { AsyncView } from '@/components/asyncView'

export function HomePage() {
  const recentVideos = useMemo(() => readRecentVideos(), [])

  const loader = useCallback(
    (signal: AbortSignal) =>
      apiGet<TrendingResponse>('/api/trending', { signal }),
    [],
  )
  const trending = useApiResource<TrendingResponse>({
    key: 'trending',
    loader,
  })

  return (
    <div className="space-y-6">
      <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <SectionHeader
            title="トレンド"
            action={
              <button
                type="button"
                onClick={trending.reload}
                className="rounded-full border border-[#d9d9d9] bg-white px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-chip"
              >
                更新
              </button>
            }
          />
          <AsyncView
            state={trending}
            onRetry={trending.reload}
            loading={<VideoGridSkeleton count={12} />}
            empty={<p className="text-sm text-muted">表示できる動画がありません。</p>}
          >
            {(data) => <VideoGrid videos={data.videos.slice(0, 12)} />}
          </AsyncView>
        </div>

        <div className="min-w-0">
          <SectionHeader title="最近見た動画" />
          <RecentVideos videos={recentVideos} />
        </div>
      </div>
    </div>
  )
}
