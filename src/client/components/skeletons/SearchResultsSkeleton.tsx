import { VideoRowListSkeleton } from './VideoRowListSkeleton'

export function SearchResultsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="検索結果を読み込み中">
      <div className="h-4 w-40 rounded bg-line/50" />
      <VideoRowListSkeleton count={6} />
    </div>
  )
}
