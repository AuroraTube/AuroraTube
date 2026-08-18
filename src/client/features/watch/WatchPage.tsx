import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { persistRecentVideo } from '@/lib/recentVideos'
import { CommentsPanel } from './CommentsPanel'
import { WatchMetaBlock } from './WatchMetaBlock'
import { WatchRelatedColumn } from './WatchRelatedColumn'
import { WatchStreamArea } from './WatchStreamArea'
import { usePlaybackSelection } from './usePlaybackSelection'
import { useStreamResource } from './useStreamResource'
import { useWatchResource } from './useWatchResource'

/**
 * Watch page:
 * - lg+: player + meta/comments left, related right.
 * - <lg: player → meta → comments → related.
 * Stream / metadata / comments fail and retry independently.
 */
export function WatchPage() {
  const { videoId } = useParams()
  const videoState = useWatchResource(videoId)
  const streamState = useStreamResource(videoId)
  const playback = usePlaybackSelection(streamState.data)

  useEffect(() => {
    if (videoState.data) persistRecentVideo(videoState.data)
  }, [videoState.data])

  const streamReady = Boolean(streamState.data?.qualities.length)
  const metaFailed =
    Boolean(videoState.error) && !videoState.data && !videoState.loading

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <WatchStreamArea
            streamReady={streamReady}
            streamError={streamState.error}
            streamLoading={streamState.loading}
            onRetry={streamState.reload}
            playback={playback}
          />

          <WatchMetaBlock
            data={videoState.data}
            error={videoState.error}
            loading={videoState.loading}
            onRetry={videoState.reload}
          />

          {videoId ? <CommentsPanel videoId={videoId} /> : null}
        </div>

        <WatchRelatedColumn
          videos={videoState.data?.recommendedVideos ?? null}
          showSkeleton={!metaFailed}
        />
      </div>
    </div>
  )
}
