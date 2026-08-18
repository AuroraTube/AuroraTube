import type { VideoSummary } from '@shared/types'
import { VideoRow } from './VideoRow'

export function RecentVideos({ videos }: { videos: VideoSummary[] }) {
  if (!videos.length) {
    return <p className="text-sm text-muted">まだ視聴履歴はありません。</p>
  }
  return (
    <div className="divide-y divide-line rounded-xl bg-white">
      {videos.map((video) => (
        <VideoRow key={video.id} video={video} />
      ))}
    </div>
  )
}
