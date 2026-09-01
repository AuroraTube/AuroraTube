import type { VideoDetail } from '@shared/types'
import { ErrorBanner } from '@/components/feedback'
import { DescriptionSection } from './DescriptionSection'
import { WatchInfo } from './WatchInfo'
import { WatchMetaSkeleton } from './WatchMetaSkeleton'

type Props = {
  data: VideoDetail | null
  error: string | null
  loading: boolean
  onRetry: () => void
}

/** Title / channel / description — independent of stream and comments. */
export function WatchMetaBlock({ data, error, loading, onRetry }: Props) {
  if (data) {
    return (
      <>
        <WatchInfo data={data} />
        {data.description ? (
          <DescriptionSection description={data.description} />
        ) : null}
      </>
    )
  }

  if (error && !loading) {
    return <ErrorBanner message={error} onRetry={onRetry} />
  }

  return <WatchMetaSkeleton />
}
