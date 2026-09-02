import { btnSecondaryWide } from '@/lib/ui'
import { ErrorBanner } from './ErrorBanner'
import { InlineStatus } from './InlineStatus'

type Props = {
  continuation?: string
  loadingMore: boolean
  onLoadMore: () => void
  error?: string | null
  loadingLabel?: string
}

/** Standard “さらに読み込む” + optional error strip for paginated lists. */
export function LoadMoreButton({
  continuation,
  loadingMore,
  onLoadMore,
  error,
  loadingLabel = '追加を読み込み中…',
}: Props) {
  return (
    <>
      {error ? (
        <div className="mt-4">
          <ErrorBanner message={error} onRetry={onLoadMore} />
        </div>
      ) : null}

      {continuation ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            disabled={loadingMore}
            onClick={onLoadMore}
            className={btnSecondaryWide}
          >
            {loadingMore ? '読み込み中…' : 'さらに読み込む'}
          </button>
        </div>
      ) : null}

      {loadingMore ? (
        <div className="mt-3">
          <InlineStatus>{loadingLabel}</InlineStatus>
        </div>
      ) : null}
    </>
  )
}
