import { Link } from 'react-router-dom'
import type { VideoSummary } from '@shared/types'
import { thumbnailUrl, videoMeta } from '@/lib/format'
import { ChannelLink } from './ChannelLink'
import { DurationBadge } from './DurationBadge'
import { Thumb } from './Thumb'
import { placeholderBg } from './constants'

export function VideoCard({ video }: { video: VideoSummary }) {
  return (
    <div className="group min-w-0">
      <Link to={`/watch/${encodeURIComponent(video.id)}`} className="block">
        <div className={`relative aspect-video overflow-hidden rounded-xl ${placeholderBg}`}>
          <Thumb
            src={thumbnailUrl(video.thumbnails)}
            alt={video.title}
            className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
          <DurationBadge text={video.durationText} />
          {video.badges?.includes('LIVE') ? (
            <span className="absolute left-1 top-1 rounded bg-red-600 px-1.5 text-[11px] font-semibold text-white">
              LIVE
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 line-clamp-2 text-sm font-medium leading-snug text-ink">{video.title}</h3>
      </Link>
      <div className="mt-1.5 space-y-0.5 pl-0">
        <ChannelLink
          name={video.author}
          channelId={video.authorId}
          avatar={video.authorAvatar}
        />
        <p className="truncate text-xs text-muted sm:text-sm">{videoMeta(video)}</p>
      </div>
    </div>
  )
}
