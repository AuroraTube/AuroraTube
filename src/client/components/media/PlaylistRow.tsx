import { Link } from 'react-router-dom'
import type { SearchPlaylistSummary } from '@shared/types'
import { formatCompactNumber, thumbnailUrl } from '@/lib/format'
import { ChannelLink } from './ChannelLink'
import { Thumb } from './Thumb'
import { placeholderBg } from './constants'

export function PlaylistRow({ playlist }: { playlist: SearchPlaylistSummary }) {
  return (
    <div className="flex gap-3 py-2 sm:gap-4">
      <Link
        to={`/playlist/${encodeURIComponent(playlist.id)}`}
        className={`relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg ${placeholderBg} sm:w-48`}
      >
        <Thumb
          src={thumbnailUrl(playlist.thumbnails)}
          alt={playlist.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-y-0 right-0 flex w-2/5 items-center justify-center bg-black/70 text-center text-xs font-medium text-white">
          {playlist.videoCount != null
            ? `${formatCompactNumber(playlist.videoCount)} 本`
            : 'プレイリスト'}
        </div>
      </Link>
      <div className="min-w-0 flex-1 py-0.5">
        <Link
          to={`/playlist/${encodeURIComponent(playlist.id)}`}
          className="block transition hover:opacity-90"
        >
          <h3 className="line-clamp-2 text-sm font-medium text-ink sm:text-base">{playlist.title}</h3>
        </Link>
        {(playlist.author || playlist.authorId) && (
          <div className="mt-1.5">
            <ChannelLink name={playlist.author ?? 'Unknown'} channelId={playlist.authorId} />
          </div>
        )}
      </div>
    </div>
  )
}
