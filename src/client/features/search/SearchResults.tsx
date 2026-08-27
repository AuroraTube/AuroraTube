import type { ReactNode } from 'react'
import type { SearchResults as SearchResultsData, SearchType } from '@shared/types'
import { SectionHeader } from '@/components/feedback'
import { ChannelRow, PlaylistRow, VideoRow } from '@/components/media'
import { searchResultCount, searchTypeLabel } from '@/lib/search'
import { SearchEmptyState } from './SearchEmptyState'

function ResultSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <SectionHeader title={title} />
      {children}
    </section>
  )
}

export function SearchResults({ data, type }: { data: SearchResultsData; type: SearchType }) {
  if (type === 'all') {
    const empty = searchResultCount(data) === 0
    return (
      <div className="space-y-8">
        {data.videos.length > 0 && (
          <ResultSection title="動画">
            <div className="divide-y divide-line">
              {data.videos.map((video) => (
                <VideoRow key={video.id} video={video} />
              ))}
            </div>
          </ResultSection>
        )}
        {data.channels.length > 0 && (
          <ResultSection title="チャンネル">
            <div className="space-y-1">
              {data.channels.map((channel) => (
                <ChannelRow key={channel.id} channel={channel} />
              ))}
            </div>
          </ResultSection>
        )}
        {data.playlists.length > 0 && (
          <ResultSection title="プレイリスト">
            <div className="space-y-1">
              {data.playlists.map((playlist) => (
                <PlaylistRow key={playlist.id} playlist={playlist} />
              ))}
            </div>
          </ResultSection>
        )}
        {empty && <SearchEmptyState />}
      </div>
    )
  }

  if (type === 'video') {
    if (!data.videos.length) return <SearchEmptyState />
    return (
      <ResultSection title={searchTypeLabel(type)}>
        <div className="divide-y divide-line">
          {data.videos.map((video) => (
            <VideoRow key={video.id} video={video} />
          ))}
        </div>
      </ResultSection>
    )
  }

  if (type === 'channel') {
    if (!data.channels.length) return <SearchEmptyState />
    return (
      <ResultSection title={searchTypeLabel(type)}>
        <div className="space-y-1">
          {data.channels.map((channel) => (
            <ChannelRow key={channel.id} channel={channel} />
          ))}
        </div>
      </ResultSection>
    )
  }

  if (!data.playlists.length) return <SearchEmptyState />
  return (
    <ResultSection title={searchTypeLabel(type)}>
      <div className="space-y-1">
        {data.playlists.map((playlist) => (
          <PlaylistRow key={playlist.id} playlist={playlist} />
        ))}
      </div>
    </ResultSection>
  )
}
