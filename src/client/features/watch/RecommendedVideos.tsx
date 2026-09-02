import type { VideoSummary } from '@shared/types'
import { SectionHeader } from '@/components/feedback'
import { VideoRow } from '@/components/media'

type Props = {
  videos: VideoSummary[]
  /** Use narrower row layout (watch page sidebar). */
  compact?: boolean
}

export function RecommendedVideos({ videos, compact = false }: Props) {
  return (
    <div>
      <SectionHeader title="関連動画" />
      <div className="divide-y divide-line">
        {videos.length ? (
          videos.map((video) => (
            <VideoRow key={video.id} video={video} compact={compact} />
          ))
        ) : (
          <p className="py-4 text-sm text-muted">関連動画はありません。</p>
        )}
      </div>
    </div>
  )
}
