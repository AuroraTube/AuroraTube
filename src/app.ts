import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import {
  channelHandler,
  channelVideosHandler,
  channelStreamsHandler,
  channelPlaylistsHandler,
  channelCommunityHandler,
  commentsHandler,
  healthHandler,
  playlistHandler,
  searchHandler,
  streamHandler,
  trendingHandler,
  watchHandler,
  mediaProxyHandler,
} from './api/routes'
import { jsonError } from './api/envelope'
import { isApiException, notFound } from './lib/errors'
import { errorFields, logError } from './lib/log'
import { applySecurityHeaders } from './lib/securityHeaders'
import { serveSpa } from './routes/spa'

const app = new Hono<{ Bindings: Env }>()

/** Baseline browser hardening for every response. */
app.use('*', async (c, next) => {
  await next()
  applySecurityHeaders(c.res.headers)
})

/** Public read-only JSON API. */
app.use(
  '/api/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Accept'],
    maxAge: 86400,
  }),
)

app.get('/api/search', searchHandler)
app.get('/api/watch/:videoId', watchHandler)
app.get('/api/stream/:videoId', streamHandler)
app.get('/api/comments', commentsHandler)
app.get('/api/channel/:channelId', channelHandler)
app.get('/api/channel/:channelId/videos', channelVideosHandler)
app.get('/api/channel/:channelId/streams', channelStreamsHandler)
app.get('/api/channel/:channelId/playlists', channelPlaylistsHandler)
app.get('/api/channel/:channelId/community', channelCommunityHandler)
app.get('/api/playlist/:playlistId', playlistHandler)
app.get('/api/trending', trendingHandler)
app.get('/api/health', healthHandler)
app.get('/api/media-proxy', mediaProxyHandler)

app.onError((error: unknown, c) => {
  if (isApiException(error)) {
    return c.json(
      { ok: false, error: error.toJSON() },
      error.status as ContentfulStatusCode,
    )
  }
  // Structured fields only — no request bodies, secrets, or upstream URLs.
  logError('app.unhandled', errorFields(error))
  return c.json(
    {
      ok: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal error', retryable: true },
    },
    500,
  )
})

app.notFound((c) => {
  const path = new URL(c.req.url).pathname
  return path.startsWith('/api/') ? jsonError(notFound('Route not found')) : serveSpa(c)
})

export default { fetch: app.fetch }
