import { withApiErrors } from '../envelope'
import type { Context } from 'hono'
import { getTrending } from '../services/trending'

export const trendingHandler = withApiErrors(async (_c: Context) => {
  return getTrending()
})
