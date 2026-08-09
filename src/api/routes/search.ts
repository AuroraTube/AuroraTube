import type { Context } from 'hono'
import { withApiErrors } from '../envelope'
import {
  optionalPageParam,
  optionalSearchTypeParam,
  requireSearchQueryParam,
} from '../params'
import { getSearchResults } from '../services/search'

export const searchHandler = withApiErrors(async (c: Context) => {
  const q = requireSearchQueryParam(c)
  const type = optionalSearchTypeParam(c)
  const page = optionalPageParam(c)
  return getSearchResults(q, type, page)
})
