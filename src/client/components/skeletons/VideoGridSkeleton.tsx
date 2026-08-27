import { VideoCardSkeleton } from './primitives'

export function VideoGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
      aria-busy="true"
      aria-label="読み込み中"
    >
      {Array.from({ length: count }).map((_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </div>
  )
}
