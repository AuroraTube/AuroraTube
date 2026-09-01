import { PostSkeleton } from './primitives'

export function PostListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="読み込み中">
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  )
}
