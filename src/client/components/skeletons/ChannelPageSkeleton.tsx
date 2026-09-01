import { SkeletonBar } from './primitives'
import { VideoRowListSkeleton } from './VideoRowListSkeleton'

export function ChannelPageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="チャンネルを読み込み中">
      <div className="space-y-4">
        <div className="h-28 w-full rounded-xl bg-line/50 sm:h-36" />
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 rounded-full bg-line/60 sm:h-20 sm:w-20" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBar className="h-5 w-48 bg-line/60" />
            <SkeletonBar className="h-3.5 w-32" />
            <SkeletonBar className="h-3 w-64 max-w-full" />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-line/50" />
        ))}
      </div>
      <VideoRowListSkeleton count={5} />
    </div>
  )
}
