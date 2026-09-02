import { SkeletonBar } from './primitives'
import { VideoRowListSkeleton } from './VideoRowListSkeleton'

export function PlaylistPageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="プレイリストを読み込み中">
      <SkeletonBar className="h-6 w-64 bg-line/60" />
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 rounded-full bg-line/50" />
        <SkeletonBar className="h-3.5 w-32" />
        <SkeletonBar className="h-3.5 w-16" />
      </div>
      <VideoRowListSkeleton count={8} />
    </div>
  )
}
