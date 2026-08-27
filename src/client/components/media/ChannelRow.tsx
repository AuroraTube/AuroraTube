import { Link } from 'react-router-dom'
import type { SearchChannelSummary } from '@shared/types'
import { joinParts } from '@/lib/format'
import { Avatar } from './Avatar'

export function ChannelRow({ channel }: { channel: SearchChannelSummary }) {
  return (
    <Link
      to={`/channel/${encodeURIComponent(channel.id)}`}
      className="flex items-center gap-4 rounded-xl px-2 py-3 transition hover:bg-black/[0.03]"
    >
      <Avatar src={channel.avatar} size="md" />
      <div className="min-w-0">
        <h3 className="truncate font-medium text-ink">{channel.name}</h3>
        <p className="truncate text-sm text-muted">
          {joinParts(channel.handle, channel.subscribersText)}
        </p>
      </div>
    </Link>
  )
}
