import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { SearchType } from '@shared/types'
import { AsyncView } from '@/components/asyncView'
import { PillGroup } from '@/components/pills'
import { SearchResultsSkeleton } from '@/components/skeletons'
import {
  SEARCH_TYPES,
  buildSearchParams,
  canPaginateNext,
  readSearchQuery,
  searchResultCount,
  searchTypeLabel,
} from '@/lib/search'
import { SearchEmptyState } from './SearchEmptyState'
import { SearchHeader } from './SearchHeader'
import { SearchResults } from './SearchResults'
import { useSearchResource } from './useSearchResource'

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const query = readSearchQuery(params)
  const { q, type, page } = query

  const state = useSearchResource(q, type, page)

  const updateQuery = useCallback(
    (patch: Partial<{ q: string; type: SearchType; page: number }>) => {
      setParams(buildSearchParams(params, query, patch))
    },
    [params, query, setParams],
  )

  const totalCount = state.data ? searchResultCount(state.data) : 0
  const canGoPrev = page > 1
  const canGoNext = canPaginateNext(state.loading, totalCount)

  return (
    <div className="space-y-5">
      <PillGroup
        value={type}
        onChange={(nextType) => updateQuery({ type: nextType, page: 1 })}
        options={SEARCH_TYPES.map((t) => ({ value: t, label: searchTypeLabel(t) }))}
      />

      <AsyncView
        state={state}
        onRetry={state.reload}
        loading={<SearchResultsSkeleton />}
        empty={<SearchEmptyState>キーワードを入力してください。</SearchEmptyState>}
      >
        {(data) => (
          <div className="space-y-6">
            <SearchHeader
              type={type}
              totalCount={totalCount}
              canGoPrev={canGoPrev}
              canGoNext={canGoNext}
              onPrev={() => updateQuery({ page: page - 1 })}
              onNext={() => updateQuery({ page: page + 1 })}
            />
            <SearchResults data={data} type={type} />
          </div>
        )}
      </AsyncView>
    </div>
  )
}
