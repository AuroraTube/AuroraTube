import type { Context } from 'hono'
import {
  requireParam,
  validateChannelId,
  validateCommentSort,
  validateContinuation,
  validatePage,
  validatePlaylistId,
  validateSearchType,
  validateVideoId,
  requireSearchQuery,
} from '../lib/validate'
import type { CommentSort, SearchType } from '../shared/types'

/** Read and validate `:videoId` path param. */
export function requireVideoIdParam(c: Context): string {
  return validateVideoId(requireParam(c.req.param('videoId'), 'videoId'))
}

/** Read and validate `:channelId` path param. */
export function requireChannelIdParam(c: Context): string {
  return validateChannelId(requireParam(c.req.param('channelId'), 'channelId'))
}

/** Read and validate `:playlistId` path param. */
export function requirePlaylistIdParam(c: Context): string {
  return validatePlaylistId(requireParam(c.req.param('playlistId'), 'playlistId'))
}

/** Optional `?continuation=` query param (Invidious-style opaque token). */
export function optionalContinuationParam(c: Context): string | undefined {
  return validateContinuation(c.req.query('continuation') ?? null)
}

/** Required `?q=` search query. */
export function requireSearchQueryParam(c: Context): string {
  return requireSearchQuery(c.req.query('q') ?? null)
}

/** Optional `?type=` search type (default: all). */
export function optionalSearchTypeParam(c: Context): SearchType {
  return validateSearchType(c.req.query('type') ?? null)
}

/** Optional `?page=` (default: 1). */
export function optionalPageParam(c: Context): number {
  return validatePage(c.req.query('page') ?? null)
}

/** Required `?videoId=` for comments endpoint. */
export function requireVideoIdQuery(c: Context): string {
  return validateVideoId(requireParam(c.req.query('videoId'), 'videoId'))
}

/** Optional `?sort=` for comments (default: top). */
export function optionalCommentSortParam(c: Context): CommentSort {
  return validateCommentSort(c.req.query('sort') ?? null)
}
