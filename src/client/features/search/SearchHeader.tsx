import type { SearchType } from '@shared/types'
import { searchTypeLabel } from '@/lib/search'
import { SearchPager } from './SearchPager'

type SearchHeaderProps = {
  type: SearchType
  totalCount: number
  canGoPrev: boolean
  canGoNext: boolean
  onPrev: () => void
  onNext: () => void
}

export function SearchHeader({
  type,
  totalCount,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
}: SearchHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="text-sm text-muted">
        {searchTypeLabel(type)} · {totalCount} 件
      </div>
      <SearchPager
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPrev={onPrev}
        onNext={onNext}
      />
    </div>
  )
}
