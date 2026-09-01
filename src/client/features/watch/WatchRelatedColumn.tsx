import type { VideoSummary } from '@shared/types'
import { RelatedSkeleton } from '@/components/skeletons'
import { RecommendedVideos } from './RecommendedVideos'

type Props = {
  videos: VideoSummary[] | null
  showSkeleton: boolean
}

/**
 * Related column: sidebar on lg+, below comments on mobile.
 * Skeleton counts differ by breakpoint.
 */
export function WatchRelatedColumn({ videos, showSkeleton }: Props) {
  if (videos) {
    return (
      <aside className="min-w-0">
        <RecommendedVideos videos={videos} compact />
      </aside>
    )
  }

  if (!showSkeleton) return null

  return (
    <aside className="min-w-0">
      <div className="lg:hidden">
        <RelatedSkeleton count={4} />
      </div>
      <div className="hidden lg:block">
        <RelatedSkeleton count={12} />
      </div>
    </aside>
  )
}
