import type { Context } from 'hono'
import { withApiErrors } from '../envelope'
import { requireChannelIdParam, optionalContinuationParam } from '../params'
import {
  getChannelCommunity,
  getChannelDetail,
  getChannelPlaylists,
  getChannelStreams,
  getChannelVideos,
} from '../services/channel'

export const channelHandler = withApiErrors(async (c: Context) => {
  const channelId = requireChannelIdParam(c)
  return getChannelDetail(channelId)
})

type ChannelPageLoader = (
  channelId: string,
  continuation: string | undefined,
) => Promise<unknown>

function channelPageHandler(loader: ChannelPageLoader) {
  return withApiErrors(async (c: Context) => {
    const channelId = requireChannelIdParam(c)
    const continuation = optionalContinuationParam(c)
    return loader(channelId, continuation)
  })
}

export const channelVideosHandler = channelPageHandler(getChannelVideos)
export const channelStreamsHandler = channelPageHandler(getChannelStreams)
export const channelPlaylistsHandler = channelPageHandler(getChannelPlaylists)
export const channelCommunityHandler = channelPageHandler(getChannelCommunity)
