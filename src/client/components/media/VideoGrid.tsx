import type { VideoSummary } from '@shared/types'
import { VideoCard } from './VideoCard'

export function VideoGrid({ videos }: { videos: VideoSummary[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  )
}
