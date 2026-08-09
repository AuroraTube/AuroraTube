import { Link } from 'react-router-dom'
import type { VideoSummary } from '@shared/types'
import { videoMeta, thumbnailUrl } from '@/lib/format'
import { ChannelLink } from './ChannelLink'
import { DurationBadge } from './DurationBadge'
import { Thumb } from './Thumb'
import { placeholderBg } from './constants'

type Props = {
  video: VideoSummary
  /** Override / fallback channel avatar (e.g. channel page). */
  channelAvatar?: string
  channelId?: string
  channelName?: string
  /** When false, channel name/link only — no avatar (playlist page videos). */
  showChannelAvatar?: boolean
  /** Watch-page related videos: YouTube-sized thumb (168×94). */
  compact?: boolean
}

export function VideoRow({
  video,
  channelAvatar,
  channelId,
  channelName,
  showChannelAvatar = true,
  compact = false,
}: Props) {
  const thumbSrc = thumbnailUrl(video.thumbnails)

  // YouTube related-video thumb is 168×94 (16:9).
  const thumbClass = compact
    ? `relative h-[94px] w-[168px] shrink-0 overflow-hidden rounded-xl ${placeholderBg}`
    : `relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg ${placeholderBg} sm:w-48`

  const titleClass = compact
    ? 'line-clamp-2 text-sm font-medium leading-snug text-ink'
    : 'line-clamp-2 text-sm font-medium text-ink sm:text-base'

  const metaClass = compact
    ? 'mt-0.5 text-xs text-muted'
    : 'mt-0.5 text-xs text-muted sm:text-sm'

  return (
    <div className={compact ? 'flex gap-2.5 py-2' : 'flex gap-3 py-2 sm:gap-4'}>
      <Link to={`/watch/${encodeURIComponent(video.id)}`} className={thumbClass}>
        {thumbSrc ? (
          <Thumb
            src={thumbSrc}
            alt={video.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className={`absolute inset-0 ${placeholderBg}`} aria-hidden />
        )}
        <DurationBadge text={video.durationText} />
      </Link>
      <div className="min-w-0 flex-1 py-0.5">
        <Link
          to={`/watch/${encodeURIComponent(video.id)}`}
          className="block transition hover:opacity-90"
        >
          <h3 className={titleClass}>{video.title}</h3>
        </Link>
        <div className={compact ? 'mt-1' : 'mt-1.5'}>
          <ChannelLink
            name={channelName || video.author}
            channelId={channelId || video.authorId}
            avatar={showChannelAvatar ? channelAvatar || video.authorAvatar : undefined}
            size={compact ? 'xs' : 'sm'}
            dense={compact}
          />
        </div>
        <p className={metaClass}>{videoMeta(video)}</p>
      </div>
    </div>
  )
}
