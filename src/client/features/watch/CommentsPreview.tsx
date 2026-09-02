import { ErrorBanner } from '@/components/feedback'
import { SafeImage } from '@/components/media/SafeImage'
import { CommentSkeleton } from '@/components/skeletons/primitives'
import { useCommentsResource } from './useCommentsResource'

type Props = {
  videoId: string
  onExpand: () => void
}

/** Mobile collapsed comments strip. */
export function CommentsPreview({ videoId, onExpand }: Props) {
  const state = useCommentsResource(videoId, 'top')
  const first = state.data?.comments[0]
  const totalLabel =
    state.data?.totalCount != null
      ? `コメント · ${state.data.totalCount.toLocaleString()}`
      : 'コメント'

  if (state.error && !state.data) {
    return <ErrorBanner message={state.error} onRetry={state.reload} />
  }

  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">{totalLabel}</h2>
        <button
          type="button"
          onClick={onExpand}
          className="shrink-0 text-sm font-medium text-[#065fd4] hover:underline"
        >
          もっと見る
        </button>
      </div>

      {state.loading && !state.data ? (
        <div className="mt-2" aria-busy="true">
          <CommentSkeleton />
        </div>
      ) : first ? (
        <div className="mt-2 flex gap-2.5">
          {first.author.avatar ? (
            <SafeImage
              src={first.author.avatar}
              alt=""
              className="mt-0.5 h-7 w-7 shrink-0 rounded-full object-cover bg-line"
              fallback={<div className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-line" aria-hidden />}
            />
          ) : (
            <div className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-line" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <span className="text-xs font-medium text-ink">{first.author.name}</span>
            <p className="line-clamp-1 text-sm leading-snug text-ink">{first.text}</p>
          </div>
        </div>
      ) : state.data ? (
        <p className="mt-2 text-sm text-muted">コメントはまだありません。</p>
      ) : null}
    </div>
  )
}
