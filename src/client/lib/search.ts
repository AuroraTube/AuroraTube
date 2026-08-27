import type { SearchResults, SearchType } from '@shared/types'
import { SEARCH_TYPES } from '@shared/search'

export { SEARCH_TYPES }
export type { SearchType }

const SEARCH_TYPE_LABELS: Record<SearchType, string> = {
  all: 'すべて',
  video: '動画',
  channel: 'チャンネル',
  playlist: 'プレイリスト',
}

export type SearchQuery = {
  q: string
  type: SearchType
  page: number
}

export function searchTypeLabel(type: SearchType): string {
  return SEARCH_TYPE_LABELS[type]
}

function parseSearchType(value: string | null | undefined): SearchType {
  return SEARCH_TYPES.includes(value as SearchType) ? (value as SearchType) : 'all'
}

function normalizePage(value: number | string | null | undefined): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isInteger(n) && n > 0 ? n : 1
}

/** Canonical SPA search URL — always includes type and page. */
export function searchHref(q: string, type: SearchType = 'all', page = 1): string {
  const params = new URLSearchParams()
  const trimmed = q.trim()
  if (trimmed) params.set('q', trimmed)
  params.set('type', type)
  params.set('page', String(normalizePage(page)))
  return `/search?${params}`
}

/** Worker search API path. */
export function searchApiPath(q: string, type: SearchType, page: number): string {
  const params = new URLSearchParams({
    q,
    type,
    page: String(normalizePage(page)),
  })
  return `/api/search?${params}`
}

export function readSearchQuery(params: URLSearchParams): SearchQuery {
  return {
    q: params.get('q')?.trim() ?? '',
    type: parseSearchType(params.get('type')),
    page: normalizePage(params.get('page')),
  }
}

/**
 * Merge a partial update into search URL params.
 * Always keeps type and page explicit.
 */
export function buildSearchParams(
  current: URLSearchParams,
  currentQuery: SearchQuery,
  patch: Partial<{ q: string; type: SearchType; page: number | string }>,
): URLSearchParams {
  const next = new URLSearchParams(current)
  const q = patch.q !== undefined ? patch.q.trim() : currentQuery.q
  const type = patch.type ?? currentQuery.type
  const page = normalizePage(patch.page ?? currentQuery.page)

  if (q) next.set('q', q)
  else next.delete('q')
  next.set('type', type)
  next.set('page', String(page))
  return next
}

export function searchResultCount(data: SearchResults): number {
  return data.videos.length + data.channels.length + data.playlists.length
}

/** Invidious has no next-page token; enable next while the current page has results. */
export function canPaginateNext(loading: boolean, resultCount: number): boolean {
  return !loading && resultCount > 0
}
