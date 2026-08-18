import { withApiErrors } from '../envelope'
import type { Context } from 'hono'
import { requireVideoIdParam } from '../params'
import { getStreamPayload } from '../services/stream'

export const streamHandler = withApiErrors(async (c: Context) => {
  const videoId = requireVideoIdParam(c)
  return getStreamPayload(videoId)
})
