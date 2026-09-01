import { VideoRowSkeleton } from './primitives'

export function VideoRowListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="divide-y divide-line" aria-busy="true" aria-label="読み込み中">
      {Array.from({ length: count }).map((_, i) => (
        <VideoRowSkeleton key={i} />
      ))}
    </div>
  )
}
