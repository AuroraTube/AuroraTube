import { Link } from 'react-router-dom'
import type { ChannelPostAttachment } from '@shared/types'
import { Thumb } from '@/components/media'
import { formatCompactNumber, thumbnailUrl } from '@/lib/format'

export function PostAttachment({ attachment }: { attachment: ChannelPostAttachment }) {
  if (attachment.type === 'image') {
    const src = thumbnailUrl(attachment.thumbnails)
    if (!src) return null
    return (
      <div className="mt-3 overflow-hidden rounded-xl">
        <Thumb src={src} alt="" className="max-h-96 w-full object-cover" />
      </div>
    )
  }

  if (attachment.type === 'multiImage') {
    return (
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {attachment.images.map((group, i) => {
          const src = thumbnailUrl(group)
          if (!src) return null
          return (
            <div key={i} className="aspect-square overflow-hidden rounded-lg">
              <Thumb src={src} alt="" className="h-full w-full object-cover" />
            </div>
          )
        })}
      </div>
    )
  }

  if (attachment.type === 'video') {
    const v = attachment.video
    return (
      <Link
        to={`/watch/${encodeURIComponent(v.id)}`}
        className="mt-3 flex gap-3 rounded-xl border border-border bg-surface p-2 transition hover:bg-chip"
      >
        <div className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-lg sm:w-44">
          <Thumb
            src={thumbnailUrl(v.thumbnails)}
            alt={v.title}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 py-1">
          <p className="line-clamp-2 text-sm font-medium text-ink">{v.title}</p>
          {v.publishedText ? (
            <p className="mt-1 text-xs text-muted">{v.publishedText}</p>
          ) : null}
        </div>
      </Link>
    )
  }

  if (attachment.type === 'playlist') {
    const p = attachment.playlist
    return (
      <Link
        to={`/playlist/${encodeURIComponent(p.id)}`}
        className="mt-3 flex gap-3 rounded-xl border border-border bg-surface p-2 transition hover:bg-chip"
      >
        <div className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-lg sm:w-44">
          <Thumb
            src={thumbnailUrl(p.thumbnails)}
            alt={p.title}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 py-1">
          <p className="line-clamp-2 text-sm font-medium text-ink">{p.title}</p>
          {p.videoCount != null ? (
            <p className="mt-1 text-xs text-muted">
              {formatCompactNumber(p.videoCount) ?? p.videoCount} 本
            </p>
          ) : null}
        </div>
      </Link>
    )
  }

  if (attachment.type === 'poll') {
    return (
      <div className="mt-3 space-y-1.5 rounded-xl border border-border bg-surface p-3">
        {attachment.choices.map((c, i) => (
          <div key={i} className="rounded-lg bg-chip px-3 py-2 text-sm text-ink">
            {c.text}
          </div>
        ))}
        {attachment.totalVotes != null ? (
          <p className="pt-1 text-xs text-muted">
            {formatCompactNumber(attachment.totalVotes) ?? attachment.totalVotes} 票
          </p>
        ) : null}
      </div>
    )
  }

  return null
}
