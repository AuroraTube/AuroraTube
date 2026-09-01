/** Re-export all shared domain + API types. */

export type {
  APIErrorCode,
  APIError,
  APIEnvelope,
} from './api'

export type {
  Thumbnail,
  VideoSummary,
  VideoDetail,
} from './video'

export type {
  ChannelDetail,
  ChannelVideosPage,
  ChannelPlaylistsPage,
  ChannelPostAttachment,
  ChannelPost,
  ChannelCommunityPage,
} from './channel'

export type { PlaylistDetail } from './playlist'

export type {
  SearchType,
  SearchChannelSummary,
  SearchPlaylistSummary,
  SearchResults,
} from './search'

export type { HealthResponse, TrendingResponse } from './health'

export type {
  StreamEntry,
  StreamSubtitle,
  QualityOption,
  StreamPayload,
} from './stream'

export type {
  CommentSort,
  CommentAuthor,
  CommentItem,
  CommentsResponse,
} from './comments'
