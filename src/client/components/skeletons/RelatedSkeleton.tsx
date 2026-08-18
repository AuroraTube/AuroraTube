import { RelatedVideoSkeletonRow } from './primitives'

/**
 * Watch-page related list placeholder.
 * Default count reaches roughly the bottom of the left-column comments block.
 */
export function RelatedSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <RelatedVideoSkeletonRow key={i} />
      ))}
    </div>
  )
}
