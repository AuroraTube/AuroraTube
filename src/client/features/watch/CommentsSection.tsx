import { useCallback, useState } from 'react'
import type { CommentsResponse } from '@shared/types'
import { ErrorBanner } from '@/components/feedback'
import { CommentSkeleton } from '@/components/skeletons/primitives'
import { PillGroup } from '@/components/pills'
import { CommentRow } from './CommentRow'
import { useCommentsResource } from './useCommentsResource'

const SORT_OPTIONS = [
  { value: 'top' as const, label: '評価順' },
  { value: 'new' as const, label: '新しい順' },
]

export function CommentsSection({ videoId }: { videoId: string }) {
  const [sort, setSort] = useState<'top' | 'new'>('top')
  const state = useCommentsResource(videoId, sort)

  const onSort = useCallback((next: 'top' | 'new') => {
    setSort(next)
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-ink md:text-xl">
          {state.data?.totalCount != null
            ? `コメント · ${state.data.totalCount.toLocaleString()}`
            : 'コメント'}
        </h2>
        <PillGroup value={sort} options={SORT_OPTIONS} onChange={onSort} />
      </div>

      {state.loading && !state.data ? (
        <div className="space-y-3 rounded-xl border border-line bg-white p-4" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <CommentSkeleton key={i} />
          ))}
        </div>
      ) : state.error && !state.data ? (
        <ErrorBanner message={state.error} onRetry={state.reload} />
      ) : state.data ? (
        <CommentsList data={state.data} />
      ) : null}
    </div>
  )
}

function CommentsList({ data }: { data: CommentsResponse }) {
  if (!data.comments.length) {
    return <p className="text-sm text-muted">コメントはまだありません。</p>
  }
  return (
    <div className="divide-y divide-line rounded-xl border border-line bg-white px-3">
      {data.comments.map((c) => (
        <CommentRow key={c.commentId} comment={c} />
      ))}
    </div>
  )
}
