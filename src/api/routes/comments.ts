import type { Context } from 'hono'
import { withApiErrors } from '../envelope'
import {
  optionalCommentSortParam,
  optionalContinuationParam,
  requireVideoIdQuery,
} from '../params'
import { getComments } from '../services/comments'

export const commentsHandler = withApiErrors(async (c: Context) => {
  const videoId = requireVideoIdQuery(c)
  const sort = optionalCommentSortParam(c)
  const continuation = optionalContinuationParam(c)
  return getComments(videoId, sort, continuation)
})
