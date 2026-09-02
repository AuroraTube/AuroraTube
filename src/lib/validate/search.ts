import { badRequest } from '../errors'
import type { SearchType } from '../../shared/types'
import { SEARCH_TYPES } from '../../shared/search'
import { hasControlChars } from './chars'
import { requireParam } from './param'

const MAX_QUERY_LENGTH = 200

export function requireSearchQuery(value: string | null): string {
  const q = requireParam(value, 'q')
  if (q.length > MAX_QUERY_LENGTH) throw badRequest('Query too long')
  if (hasControlChars(q)) throw badRequest('Invalid query')
  return q
}

export function validateSearchType(value: string | null): SearchType {
  if (!value) return 'all'
  if ((SEARCH_TYPES as readonly string[]).includes(value)) return value as SearchType
  throw badRequest('Invalid type')
}

export function validatePage(value: string | null): number {
  if (!value) return 1
  const page = Number(value)
  if (!Number.isInteger(page) || page < 1 || page > 100) throw badRequest('Invalid page')
  return page
}
