import { useMemo } from 'react'
import type { ChannelVideosPage, VideoSummary } from '@shared/types'
import { mergeById } from '@shared/mergeById'
import { VideoRow } from '@/components/media'
import { ErrorBanner, LoadMoreButton, EmptyState } from '@/components/feedback'
import { VideoRowListSkeleton } from '@/components/skeletons'
import { useContinuationPage } from '@/hooks/useContinuationPage'
import { applyChannelAuthor, type ChannelAuthor } from '@shared/videoAuthor'

type Props = {
  channelId: string
  channelAuthor: ChannelAuthor
  kind?: 'videos' | 'streams'
  /** First page from parent (channel detail). When omitted, fetches on mount. */
  initialVideos?: VideoSummary[]
  initialContinuation?: string
  emptyLabel?: string
}

export function ChannelVideos({
  channelId,
  channelAuthor,
  kind = 'videos',
  initialVideos,
  initialContinuation,
  emptyLabel = '動画がありません',
}: Props) {
  const path = `/api/channel/${encodeURIComponent(channelId)}/${kind}`

  const seed = useMemo(() => {
    if (initialVideos === undefined) return null
    return {
      items: applyChannelAuthor(initialVideos, channelAuthor),
      continuation: initialContinuation,
    }
  }, [initialVideos, initialContinuation, channelAuthor])

  const select = useMemo(
    () => (data: ChannelVideosPage) => ({
      items: applyChannelAuthor(data.videos, channelAuthor),
      continuation: data.continuation,
    }),
    [channelAuthor],
  )

  const { items, continuation, loading, loadingMore, error, reload, loadMore } =
    useContinuationPage<VideoSummary, ChannelVideosPage>({
      key: `${kind}:${channelId}`,
      path,
      select,
      merge: mergeById,
      seed,
    })

  if (loading) return <VideoRowListSkeleton count={5} />

  if (error && !items.length) {
    return <ErrorBanner message={error} onRetry={reload} />
  }

  if (!items.length) return <EmptyState>{emptyLabel}</EmptyState>

  return (
    <div>
      <div className="divide-y divide-line">
        {items.map((video) => (
          <VideoRow key={video.id} video={video} />
        ))}
      </div>
      <LoadMoreButton
        continuation={continuation}
        loadingMore={loadingMore}
        onLoadMore={loadMore}
        error={error}
        loadingLabel="追加の動画を読み込み中…"
      />
    </div>
  )
}
