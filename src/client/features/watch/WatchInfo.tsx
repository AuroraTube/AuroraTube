import { Link } from 'react-router-dom'
import type { VideoDetail } from '@shared/types'
import { SafeImage } from '@/components/media/SafeImage'
import { formatCompactNumber, formatNumber, joinParts } from '@/lib/format'

export function WatchInfo({ data }: { data: VideoDetail }) {
  const metaLine = joinParts(
    data.publishedText,
    data.viewCount != null ? `${formatCompactNumber(data.viewCount)} 回視聴` : undefined,
    data.likeCount != null ? `高評価 ${formatNumber(data.likeCount)}` : undefined,
  )

  const authorBlock = (
    <>
      {data.authorAvatar ? (
        <SafeImage
          src={data.authorAvatar}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
          alt=""
          fallback={<div className="h-10 w-10 shrink-0 rounded-full bg-[#e5e5e5]" aria-hidden />}
        />
      ) : (
        <div className="h-10 w-10 shrink-0 rounded-full bg-[#e5e5e5]" aria-hidden />
      )}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <div className="text-sm font-medium text-ink">{data.author}</div>
          {data.badges?.length
            ? data.badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-line bg-[#f7f7f7] px-2 py-0.5 text-[11px] leading-none text-ink"
                >
                  {badge}
                </span>
              ))
            : null}
        </div>
        {data.subscriberText ? (
          <div className="mt-0.5 text-xs text-muted">{data.subscriberText}</div>
        ) : null}
      </div>
    </>
  )

  return (
    <div className="space-y-3">
      <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[22px]">
        {data.title}
      </h1>

      {metaLine ? <p className="text-sm text-muted">{metaLine}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        {data.authorId ? (
          <Link
            to={`/channel/${encodeURIComponent(data.authorId)}`}
            className="flex items-center gap-3 rounded-full border border-line bg-white px-3.5 py-2.5 transition hover:bg-chip"
          >
            {authorBlock}
          </Link>
        ) : (
          <div className="flex items-center gap-3 rounded-full border border-line bg-white px-3.5 py-2.5">
            {authorBlock}
          </div>
        )}
      </div>
    </div>
  )
}
