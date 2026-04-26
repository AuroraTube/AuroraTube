import express from 'express';
import { badRequest, HttpError } from '../lib/httpError.js';
import { fetchChannelPage } from '../services/channelService.js';
import { fetchSearchPage, fetchSearchSuggestions, fetchTrendingPage } from '../services/searchService.js';
import { fetchVideoComments, fetchVideoPage, streamVideo } from '../services/videoService.js';

export const apiRouter = express.Router();

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const parseSearchFilters = (query) => ({
  page: Math.max(1, Number(query.page || 1) || 1),
  sort: String(query.sort || 'relevance').trim() || 'relevance',
  date: String(query.date || '').trim(),
  duration: String(query.duration || '').trim(),
  type: String(query.type || 'all').trim() || 'all',
  features: String(query.features || '').trim(),
  region: String(query.region || '').trim().toUpperCase() || undefined,
  hl: String(query.hl || '').trim() || undefined,
});

apiRouter.get('/health', (_req, res) => res.json({ ok: true }));

apiRouter.get('/search', asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) throw badRequest('q required');
  const filters = parseSearchFilters(req.query);
  const items = await fetchSearchPage(q, filters);
  res.json({ query: q, filters, items });
}));

apiRouter.get('/search/suggestions', asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) throw badRequest('q required');
  const suggestions = await fetchSearchSuggestions(q);
  res.json({ query: q, suggestions });
}));

apiRouter.get('/trending', asyncHandler(async (req, res) => {
  const type = String(req.query.type || 'default').trim() || 'default';
  const region = String(req.query.region || '').trim().toUpperCase() || undefined;
  const items = await fetchTrendingPage(type, region);
  res.json({ type, region: region || undefined, items });
}));

apiRouter.get('/watch/:id', asyncHandler(async (req, res) => {
  const data = await fetchVideoPage(String(req.params.id || '').trim());
  res.json(data);
}));

apiRouter.get('/watch/:id/comments', asyncHandler(async (req, res) => {
  const data = await fetchVideoComments(
    String(req.params.id || '').trim(),
    String(req.query.continuation || '').trim(),
    String(req.query.instance || '').trim(),
  );
  res.json(data);
}));

apiRouter.get('/watch/:id/stream', asyncHandler(async (req, res) => {
  await streamVideo(res, String(req.params.id || '').trim());
}));

apiRouter.get('/channel', asyncHandler(async (req, res) => {
  const handle = String(req.query.id || req.query.handle || '').trim();
  if (!handle) throw badRequest('id required');
  const continuation = String(req.query.continuation || '').trim();
  const sortBy = String(req.query.sortBy || req.query.sort_by || 'newest').trim() || 'newest';
  const data = await fetchChannelPage(handle, { continuation, sortBy });
  res.json(data);
}));

apiRouter.use((error, _req, res, _next) => {
  const statusCode = Number(error instanceof HttpError ? error.statusCode : error?.statusCode || 500);
  const message = error instanceof HttpError ? error.message : error?.message || 'internal error';
  if (statusCode >= 500) {
    console.error(error);
  }
  res.status(statusCode).json({ error: message, details: error?.details || undefined });
});
