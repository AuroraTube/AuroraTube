export function SkeletonBar({ className }: { className: string }) {
  return <div className={`rounded bg-line/40 ${className}`} />
}

export function VideoCardSkeleton() {
  return (
    <div className="space-y-2">
      <div className="aspect-video w-full rounded-xl bg-line/60" />
      <div className="flex gap-2">
        <div className="h-8 w-8 shrink-0 rounded-full bg-line/50" />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonBar className="h-3.5 w-full bg-line/60" />
          <SkeletonBar className="h-3 w-[70%]" />
          <SkeletonBar className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  )
}

export function VideoRowSkeleton() {
  return (
    <div className="flex gap-3 py-3">
      <div className="aspect-video w-40 shrink-0 rounded-lg bg-line/60 sm:w-48" />
      <div className="min-w-0 flex-1 space-y-2 py-0.5">
        <SkeletonBar className="h-3.5 w-[90%] bg-line/60" />
        <SkeletonBar className="h-3 w-[60%]" />
        <SkeletonBar className="h-3 w-[40%]" />
      </div>
    </div>
  )
}

/** Compact related-video row — sizes match VideoRow compact (168×94). */
export function RelatedVideoSkeletonRow() {
  return (
    <div className="flex gap-2.5 py-2">
      <div className="h-[94px] w-[168px] shrink-0 rounded-xl bg-line/60" />
      <div className="min-w-0 flex-1 space-y-2 py-0.5">
        <SkeletonBar className="h-3 w-full bg-line/60" />
        <SkeletonBar className="h-3 w-[66%]" />
        <SkeletonBar className="h-3 w-1/2" />
      </div>
    </div>
  )
}

export function PlaylistRowSkeleton() {
  return (
    <div className="flex gap-3 py-3">
      <div className="aspect-video w-40 shrink-0 rounded-lg bg-line/60 sm:w-48" />
      <div className="min-w-0 flex-1 space-y-2 py-0.5">
        <SkeletonBar className="h-3.5 w-[80%] bg-line/60" />
        <SkeletonBar className="h-3 w-[50%]" />
        <SkeletonBar className="h-3 w-[30%]" />
      </div>
    </div>
  )
}

export function PostSkeleton() {
  return (
    <div className="flex gap-3 border-b border-line py-4">
      <div className="h-8 w-8 shrink-0 rounded-full bg-line/50" />
      <div className="min-w-0 flex-1 space-y-2">
        <SkeletonBar className="h-3 w-28 bg-line/50" />
        <SkeletonBar className="h-3 w-full" />
        <SkeletonBar className="h-3 w-[85%]" />
        <SkeletonBar className="h-3 w-[40%] bg-line/30" />
      </div>
    </div>
  )
}

export function CommentSkeleton() {
  return (
    <div className="flex gap-3">
      <div className="h-8 w-8 shrink-0 rounded-full bg-line/50" />
      <div className="min-w-0 flex-1 space-y-2">
        <SkeletonBar className="h-3 w-24 bg-line/50" />
        <SkeletonBar className="h-3 w-full" />
        <SkeletonBar className="h-3 w-[80%] bg-line/30" />
      </div>
    </div>
  )
}
