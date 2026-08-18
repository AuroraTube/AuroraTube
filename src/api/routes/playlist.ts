import { withApiErrors } from '../envelope'
import type { Context } from 'hono'
import { requirePlaylistIdParam } from '../params'
import { getPlaylistDetail } from '../services/playlist'

export const playlistHandler = withApiErrors(async (c: Context) => {
  const playlistId = requirePlaylistIdParam(c)
  return getPlaylistDetail(playlistId)
})
