import type { ChannelAuthor } from '@shared/videoAuthor'
import { ChannelVideos } from './ChannelVideos'

type Props = {
  channelId: string
  channelAuthor: ChannelAuthor
}

export function ChannelStreams({ channelId, channelAuthor }: Props) {
  return (
    <ChannelVideos
      channelId={channelId}
      channelAuthor={channelAuthor}
      kind="streams"
      emptyLabel="ライブ配信はありません"
    />
  )
}
