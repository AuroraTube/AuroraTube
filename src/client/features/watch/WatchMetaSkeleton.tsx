import { SkeletonBar } from '@/components/skeletons/primitives'

/** Placeholder for WatchInfo + description only. */
export function WatchMetaSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="メタデータを読み込み中">
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="h-6 w-[92%] rounded bg-line/60 md:h-7" />
          <div className="h-6 w-[55%] rounded bg-line/40 md:h-7" />
        </div>
        <SkeletonBar className="h-3.5 w-48" />
        <div className="flex items-center gap-3 rounded-full border border-line bg-white px-3.5 py-2.5">
          <div className="h-10 w-10 shrink-0 rounded-full bg-line/60" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBar className="h-3.5 w-28 bg-line/60" />
            <SkeletonBar className="h-3 w-20" />
          </div>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-line bg-white p-4">
        <SkeletonBar className="h-3.5 w-full bg-line/50" />
        <SkeletonBar className="h-3.5 w-[95%]" />
        <SkeletonBar className="h-3.5 w-[70%]" />
      </div>
    </div>
  )
}
