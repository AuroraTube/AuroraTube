import { useCallback } from 'react'
import type { SearchResults, SearchType } from '@shared/types'
import { apiGet } from '@/lib/api'
import { useApiResource } from '@/hooks/useApiResource'
import { searchApiPath } from '@/lib/search'

export function useSearchResource(q: string, type: SearchType, page: number) {
  const loader = useCallback(
    (signal: AbortSignal) => {
      if (!q.trim()) return Promise.reject(new Error('Empty query'))
      return apiGet<SearchResults>(searchApiPath(q, type, page), {
        signal,
      })
    },
    [q, type, page],
  )

  return useApiResource<SearchResults>({
    key: q.trim() ? `search:${q}:${type}:${page}` : null,
    enabled: Boolean(q.trim()),
    loader,
  })
}
