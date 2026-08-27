import type { ChannelCommunityPage, ChannelPost } from '@shared/types'
import { Avatar } from '@/components/media'
import { ErrorBanner, LoadMoreButton, EmptyState } from '@/components/feedback'
import { PostListSkeleton } from '@/components/skeletons'
import { mergeById } from '@shared/mergeById'
import { formatCompactNumber } from '@/lib/format'
import { useContinuationPage } from '@/hooks/useContinuationPage'
import { PostAttachment } from './PostAttachment'

type Props = {
  channelId: string
}

function PostCard({ post }: { post: ChannelPost }) {
  return (
    <article className="border-b border-border py-4 last:border-b-0">
      <div className="flex gap-3">
        <Avatar src={post.authorAvatar} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-medium text-ink">{post.author}</span>
            {post.publishedText ? (
              <span className="text-xs text-muted">{post.publishedText}</span>
            ) : null}
          </div>
          {post.content ? (
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {post.content}
            </p>
          ) : null}
          {post.attachment ? <PostAttachment attachment={post.attachment} /> : null}
          <div className="mt-2 flex gap-3 text-xs text-muted">
            {post.likeCount != null && post.likeCount > 0 ? (
              <span>👍 {formatCompactNumber(post.likeCount) ?? post.likeCount}</span>
            ) : null}
            {post.replyCount != null && post.replyCount > 0 ? (
              <span>💬 {formatCompactNumber(post.replyCount) ?? post.replyCount}</span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}

export function ChannelPosts({ channelId }: Props) {
  const path = `/api/channel/${encodeURIComponent(channelId)}/community`
  const { items, continuation, loading, loadingMore, error, reload, loadMore } =
    useContinuationPage<ChannelPost, ChannelCommunityPage>({
      key: channelId,
      path,
      select: (data) => ({ items: data.posts, continuation: data.continuation }),
      merge: mergeById,
    })

  if (loading) return <PostListSkeleton count={4} />

  if (error && !items.length) {
    return <ErrorBanner message={error} onRetry={reload} />
  }

  if (!items.length) {
    return <EmptyState>投稿はありません</EmptyState>
  }

  return (
    <div>
      <div>
        {items.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <LoadMoreButton
        continuation={continuation}
        loadingMore={loadingMore}
        onLoadMore={loadMore}
        error={error}
        loadingLabel="追加の投稿を読み込み中…"
      />
    </div>
  )
}
