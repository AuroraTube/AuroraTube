import type { ChannelPlaylistsPage, SearchPlaylistSummary } from '@shared/types'
import { mergeById } from '@shared/mergeById'
import { PlaylistRow } from '@/components/media'
import { ErrorBanner, LoadMoreButton, EmptyState } from '@/components/feedback'
import { PlaylistRowListSkeleton } from '@/components/skeletons'
import { useContinuationPage } from '@/hooks/useContinuationPage'

type Props = {
  channelId: string
}

export function ChannelPlaylists({ channelId }: Props) {
  const path = `/api/channel/${encodeURIComponent(channelId)}/playlists`
  const { items, continuation, loading, loadingMore, error, reload, loadMore } =
    useContinuationPage<SearchPlaylistSummary, ChannelPlaylistsPage>({
      key: channelId,
      path,
      select: (data) => ({ items: data.playlists, continuation: data.continuation }),
      merge: mergeById,
    })

  if (loading) return <PlaylistRowListSkeleton count={5} />
  if (error && !items.length) return <ErrorBanner message={error} onRetry={reload} />
  if (!items.length) return <EmptyState>プレイリストはありません</EmptyState>

  return (
    <div>
      <div className="divide-y divide-border">
        {items.map((playlist) => (
          <PlaylistRow key={playlist.id} playlist={playlist} />
        ))}
      </div>
      <LoadMoreButton
        continuation={continuation}
        loadingMore={loadingMore}
        onLoadMore={loadMore}
        error={error}
        loadingLabel="追加のプレイリストを読み込み中…"
      />
    </div>
  )
}
