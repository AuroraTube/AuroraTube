import { Link } from 'react-router-dom'
import { Avatar } from './Avatar'

type Props = {
  name: string
  channelId?: string
  avatar?: string
  className?: string
  /** Avatar size */
  size?: 'xs' | 'sm' | 'md'
  /** Keep channel name smaller than video titles (related videos). */
  dense?: boolean
}

/**
 * Channel avatar + name. Links to channel page when channelId is known.
 * Stops navigation bubbling so it can sit inside a video card link area.
 * Avatar is omitted when no image URL is available (no empty placeholder frame).
 */
export function ChannelLink({
  name,
  channelId,
  avatar,
  className = '',
  size = 'sm',
  dense = false,
}: Props) {
  const body = (
    <>
      {avatar ? <Avatar src={avatar} size={size} /> : null}
      <span className="min-w-0 truncate hover:text-ink">{name}</span>
    </>
  )

  const textSize = dense ? 'text-xs text-muted' : 'text-xs text-muted sm:text-sm'
  const gap = dense || size === 'xs' ? 'gap-1.5' : 'gap-2'
  const base = `inline-flex max-w-full items-center ${gap} ${textSize} ${className}`.trim()

  if (!channelId) {
    return <span className={base}>{body}</span>
  }

  return (
    <Link
      to={`/channel/${encodeURIComponent(channelId)}`}
      className={`${base} transition hover:text-ink`}
      onClick={(e) => e.stopPropagation()}
    >
      {body}
    </Link>
  )
}
