import { PlaylistRowSkeleton } from './primitives'

export function PlaylistRowListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="divide-y divide-border" aria-busy="true" aria-label="読み込み中">
      {Array.from({ length: count }).map((_, i) => (
        <PlaylistRowSkeleton key={i} />
      ))}
    </div>
  )
}
