import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import type { VideoDetail } from '@shared/types'
import { ErrorBanner } from '@/components/feedback'
import { persistRecentVideo } from '@/lib/recentVideos'
import { CommentsPanel } from './CommentsPanel'
import { DescriptionSection } from './DescriptionSection'
import { RecommendedVideos } from './RecommendedVideos'
import { WatchInfo } from './WatchInfo'
import { RelatedSkeleton } from '@/components/skeletons'
import { WatchMetaSkeleton } from './WatchMetaSkeleton'
import { WatchStreamArea } from './WatchStreamArea'
import { usePlaybackSelection } from './usePlaybackSelection'
import { useStreamResource } from './useStreamResource'
import { useWatchResource } from './useWatchResource'

/**
 * Watch page layout:
 * - lg+: player + meta/desc/comments on the left, related videos on the right.
 * - <lg: stacked; related videos below; description & comments use mobile expanders.
 *
 * The sidebar column is always reserved on lg+ so the player width stays stable,
 * even when related content is hidden after a metadata failure.
 */
export function WatchPage() {
  const { videoId } = useParams()
  const videoState = useWatchResource(videoId)
  const streamState = useStreamResource(videoId)
  const playback = usePlaybackSelection(streamState.data)

  useEffect(() => {
    if (videoState.data) persistRecentVideo(videoState.data)
  }, [videoState.data])

  const displayData: VideoDetail | null = useMemo(
    () => videoState.data ?? null,
    [videoState.data],
  )

  const streamReady = Boolean(streamState.data?.qualities.length)
  const metaFailed =
    Boolean(videoState.error) && !displayData && !videoState.loading
  const bothFailed =
    Boolean(streamState.error) &&
    Boolean(videoState.error) &&
    !streamReady &&
    !streamState.loading &&
    !videoState.loading

  if (bothFailed) {
    return (
      <ErrorBanner
        message={[
          '読み込みに失敗しました。',
          streamState.error ? `ストリーム: ${streamState.error}` : '',
          videoState.error ? `メタデータ: ${videoState.error}` : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onRetry={() => {
          streamState.reload()
          videoState.reload()
        }}
      />
    )
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <div className="min-w-0 flex-1 space-y-4">
          <WatchStreamArea
            streamReady={streamReady}
            streamError={streamState.error}
            streamLoading={streamState.loading}
            onRetry={streamState.reload}
            playback={playback}
          />

          {displayData ? (
            <>
              <WatchInfo data={displayData} />
              {displayData.description ? (
                <DescriptionSection description={displayData.description} />
              ) : null}
              {videoId ? <CommentsPanel videoId={videoId} /> : null}
              <div className="lg:hidden">
                <RecommendedVideos videos={displayData.recommendedVideos} compact />
              </div>
            </>
          ) : metaFailed ? (
            <>
              <p className="text-sm text-muted">
                メタデータの取得に失敗しました。再生は継続できます。
              </p>
              {videoId ? <CommentsPanel videoId={videoId} /> : null}
            </>
          ) : (
            <WatchMetaSkeleton />
          )}
        </div>

        {/* Always reserve width on lg+ so the player frame does not resize. */}
        <aside className="hidden w-full shrink-0 lg:block lg:w-[340px] xl:w-[380px]">
          {displayData ? (
            <RecommendedVideos videos={displayData.recommendedVideos} compact />
          ) : metaFailed ? null : (
            <RelatedSkeleton />
          )}
        </aside>
      </div>
    </div>
  )
}
