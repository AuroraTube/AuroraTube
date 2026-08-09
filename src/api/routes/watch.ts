import { withApiErrors } from '../envelope'
import type { Context } from 'hono'
import { requireVideoIdParam } from '../params'
import { getVideoDetail } from '../services/watch'

export const watchHandler = withApiErrors(async (c: Context) => {
  const videoId = requireVideoIdParam(c)
  return getVideoDetail(videoId)
})
