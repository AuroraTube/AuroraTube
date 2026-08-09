import type { CommentItem } from '@shared/types'

export function CommentRow({ comment }: { comment: CommentItem }) {
  return (
    <div className="flex gap-3 py-3">
      {comment.author.avatar ? (
        <img
          src={comment.author.avatar}
          alt=""
          className="h-9 w-9 shrink-0 rounded-full object-cover bg-line"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="h-9 w-9 shrink-0 rounded-full bg-line" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-medium text-ink">
            {comment.author.name}
            {comment.author.verified ? (
              <span className="ml-1 text-muted" title="認証済み">
                ✓
              </span>
            ) : null}
            {comment.author.isCreator ? (
              <span className="ml-1 rounded bg-chip px-1.5 py-0.5 text-[10px] font-medium text-muted">
                作成者
              </span>
            ) : null}
          </span>
          {comment.publishedTime ? (
            <span className="text-xs text-muted">{comment.publishedTime}</span>
          ) : null}
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">{comment.text}</p>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted">
          {comment.likeText || comment.likeCount != null ? (
            <span>👍 {comment.likeText ?? comment.likeCount}</span>
          ) : null}
          {comment.replyText || comment.replyCount ? (
            <span>返信 {comment.replyText ?? comment.replyCount}</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
