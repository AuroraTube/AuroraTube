import { useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { ChannelDetail } from '@shared/types'
import { apiGet } from '@/lib/api'
import { useApiResource } from '@/hooks/useApiResource'
import { AsyncView } from '@/components/asyncView'
import { ChannelPageSkeleton } from '@/components/skeletons'
import { PillGroup } from '@/components/pills'
import { ChannelHeader } from './ChannelHeader'
import { ChannelVideos } from './ChannelVideos'
import { ChannelStreams } from './ChannelStreams'
import { ChannelPlaylists } from './ChannelPlaylists'
import { ChannelPosts } from './ChannelPosts'

type ChannelTab = 'videos' | 'streams' | 'playlists' | 'posts'

const TAB_OPTIONS: { value: ChannelTab; label: string }[] = [
  { value: 'videos', label: '動画' },
  { value: 'streams', label: 'ライブ' },
  { value: 'playlists', label: 'プレイリスト' },
  { value: 'posts', label: '投稿' },
]

export function ChannelPage() {
  const { channelId } = useParams()
  const loader = useCallback(
    (signal: AbortSignal) => {
      if (!channelId) return Promise.reject(new Error('Missing channelId'))
      return apiGet<ChannelDetail>(`/api/channel/${encodeURIComponent(channelId)}`, {
        signal,
      })
    },
    [channelId],
  )

  const state = useApiResource<ChannelDetail>({
    key: channelId ?? null,
    enabled: Boolean(channelId),
    loader,
  })

  return (
    <AsyncView
      state={state}
      onRetry={state.reload}
      loading={<ChannelPageSkeleton />}
    >
      {(data) => <ChannelPageBody data={data} routeChannelId={channelId!} />}
    </AsyncView>
  )
}

function ChannelPageBody({
  data,
  routeChannelId,
}: {
  data: ChannelDetail
  routeChannelId: string
}) {
  const [tab, setTab] = useState<ChannelTab>('videos')

  const channelAuthor = useMemo(
    () => ({
      id: data.id || routeChannelId,
      name: data.name,
      avatar: data.avatar,
    }),
    [data.id, data.name, data.avatar, routeChannelId],
  )

  return (
    <div className="space-y-6" key={data.id}>
      <ChannelHeader data={data} />

      <div className="space-y-4">
        <PillGroup value={tab} options={TAB_OPTIONS} onChange={setTab} />

        {tab === 'videos' ? (
          <ChannelVideos
            channelId={channelAuthor.id}
            channelAuthor={channelAuthor}
            kind="videos"
            initialVideos={data.latestVideos}
            initialContinuation={data.videosContinuation}
            emptyLabel="動画がありません"
          />
        ) : null}

        {tab === 'streams' ? (
          <ChannelStreams channelId={channelAuthor.id} channelAuthor={channelAuthor} />
        ) : null}

        {tab === 'playlists' ? <ChannelPlaylists channelId={channelAuthor.id} /> : null}

        {tab === 'posts' ? <ChannelPosts channelId={channelAuthor.id} /> : null}
      </div>
    </div>
  )
}
