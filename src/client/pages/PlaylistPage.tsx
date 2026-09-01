import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import type { PlaylistDetail } from '@shared/types'
import { apiGet } from '@/lib/api'
import { useApiResource } from '@/hooks/useApiResource'
import { ChannelLink, VideoRow } from '@/components/media'
import { SectionHeader, RetryButton } from '@/components/feedback'
import { PlaylistPageSkeleton } from '@/components/skeletons'
import { AsyncView } from '@/components/asyncView'

export function PlaylistPage() {
  const { playlistId } = useParams()
  const loader = useCallback(
    (signal: AbortSignal) => {
      if (!playlistId) return Promise.reject(new Error('Missing playlistId'))
      return apiGet<PlaylistDetail>(`/api/playlist/${encodeURIComponent(playlistId)}`, {
        signal,
      })
    },
    [playlistId],
  )

  const state = useApiResource<PlaylistDetail>({
    key: playlistId ?? null,
    enabled: Boolean(playlistId),
    loader,
  })

  return (
    <AsyncView
      state={state}
      onRetry={state.reload}
      loading={<PlaylistPageSkeleton />}
    >
      {(data) => (
        <div>
          <SectionHeader title={data.title} action={<RetryButton onRetry={state.reload} />} />
          <div className="-mt-2 mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            {(data.author || data.authorId) && (
              <ChannelLink
                name={data.author ?? 'Unknown'}
                channelId={data.authorId}
                avatar={data.authorAvatar}
              />
            )}
            {data.videoCount != null ? <span>{data.videoCount}件</span> : null}
          </div>
          <div className="divide-y divide-line">
            {data.videos.length ? (
              data.videos.map((video) => (
                <VideoRow key={video.id} video={video} showChannelAvatar={false} />
              ))
            ) : (
              <p className="py-4 text-sm text-muted">動画はありません。</p>
            )}
          </div>
        </div>
      )}
    </AsyncView>
  )
}
