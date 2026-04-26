import { config } from '../config.js';
import { badRequest, notFound, unavailable } from '../lib/httpError.js';
import { isNonEmptyString, isPlainObject } from '../lib/strings.js';

const badInstances = new Map();
let rrIndex = 0;
const ACTIVE_BAD_TTL_MS = 5 * 60 * 1000;

const availableInstances = () => {
  const now = Date.now();
  const filtered = config.invidiousInstances.filter((instance) => {
    const marked = badInstances.get(instance);
    return !marked || now - marked > ACTIVE_BAD_TTL_MS;
  });
  return filtered.length ? filtered : config.invidiousInstances;
};

const rotateInstances = () => {
  const instances = availableInstances();
  if (!instances.length) return [];
  const start = rrIndex % instances.length;
  rrIndex = (rrIndex + 1) % instances.length;
  return [...instances.slice(start), ...instances.slice(0, start)];
};

const markBad = (instance) => {
  badInstances.set(instance, Date.now());
};

const normalizePath = (path) => (path.startsWith('/') ? path : `/${path}`);

const buildQuery = (query = {}) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

const shouldFailover = (error) => {
  const status = Number(error?.statusCode || error?.status || 0);
  if (status >= 500 || status === 429) return true;
  return error?.name === 'AbortError'
    || error?.code === 'ECONNRESET'
    || error?.code === 'ENOTFOUND'
    || error?.code === 'EAI_AGAIN'
    || error?.code === 'ECONNREFUSED'
    || error?.code === 'ETIMEDOUT';
};

export const fetchJsonFromInstance = async (instance, path, query = {}, options = {}) => {
  const timeoutMs = Number(options.timeoutMs || config.requestTimeoutMs);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${instance}${normalizePath(path)}${buildQuery(query)}`, {
      signal: controller.signal,
      headers: {
        accept: 'application/json',
      },
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await response.json().catch(() => null)
      : await response.text().catch(() => '');

    if (!response.ok) {
      const details = typeof payload === 'string' ? payload.slice(0, 240) : payload;
      const message = payload && typeof payload === 'object' && payload.error ? String(payload.error) : `HTTP ${response.status}`;
      const error = new Error(message);
      error.statusCode = response.status;
      error.details = details;
      throw error;
    }

    if (!isPlainObject(payload) && !Array.isArray(payload)) {
      throw new Error('invalid response shape');
    }

    return payload;
  } finally {
    clearTimeout(timer);
  }
};

const tryAcrossInstances = async (path, query = {}, options = {}) => {
  const errors = [];
  const statusCodes = [];

  for (const instance of rotateInstances()) {
    try {
      const data = await fetchJsonFromInstance(instance, path, query, options);
      return { instance, data };
    } catch (error) {
      const status = Number(error?.statusCode || error?.status || 0);
      statusCodes.push(status);
      errors.push(`${instance}: ${error?.message || String(error)}`);
      if (shouldFailover(error)) markBad(instance);
    }
  }

  if (statusCodes.length && statusCodes.every((status) => status === 404)) {
    throw notFound(`Resource not found for ${path}`, errors);
  }

  if (statusCodes.length && statusCodes.every((status) => status === 400)) {
    throw badRequest(`Bad request for ${path}`, errors);
  }

  throw unavailable(`All Invidious instances failed for ${path}`, errors);
};

export const fetchFromAny = tryAcrossInstances;

export const resolveYouTubeUrl = async (url) => {
  if (!isNonEmptyString(url)) throw badRequest('url required');
  return tryAcrossInstances('/api/v1/resolveurl', { url });
};

export const searchInvidious = async (query, filters = {}) => {
  if (!isNonEmptyString(query)) throw badRequest('q required');
  return tryAcrossInstances('/api/v1/search', {
    q: query,
    page: filters.page || 1,
    sort: filters.sort || 'relevance',
    date: filters.date || '',
    duration: filters.duration || '',
    type: filters.type || 'all',
    features: filters.features || '',
    region: filters.region || config.region,
    hl: filters.hl || config.hl,
  });
};

export const searchSuggestions = async (query) => {
  if (!isNonEmptyString(query)) throw badRequest('q required');
  return tryAcrossInstances('/api/v1/search/suggestions', { q: query });
};

export const getTrending = async (type = 'default', region = config.region) =>
  tryAcrossInstances('/api/v1/trending', { type, region, hl: config.hl });

export const getVideoFromInstance = async (instance, videoId) => {
  if (!isNonEmptyString(videoId)) throw badRequest('videoId required');
  const data = await fetchJsonFromInstance(instance, `/api/v1/videos/${encodeURIComponent(videoId)}`, { region: config.region, hl: config.hl });
  return { instance, data };
};

export const getCommentsFromInstance = async (instance, videoId, continuation = '') => {
  if (!isNonEmptyString(videoId)) throw badRequest('videoId required');
  const data = await fetchJsonFromInstance(instance, `/api/v1/comments/${encodeURIComponent(videoId)}`, {
    continuation,
    source: 'youtube',
    sort_by: 'top',
    hl: config.hl,
  });
  return { instance, data };
};

export const getChannelVideos = async (instance, channelId, { continuation = '', sortBy = 'newest' } = {}) => {
  if (!isNonEmptyString(channelId)) throw badRequest('channelId required');
  return fetchJsonFromInstance(instance, `/api/v1/channels/${encodeURIComponent(channelId)}/videos`, {
    continuation,
    sort_by: sortBy,
    hl: config.hl,
  });
};

export const getChannelPlaylists = async (instance, channelId, { continuation = '', sortBy = 'last' } = {}) => {
  if (!isNonEmptyString(channelId)) throw badRequest('channelId required');
  return fetchJsonFromInstance(instance, `/api/v1/channels/${encodeURIComponent(channelId)}/playlists`, {
    continuation,
    sort_by: sortBy,
    hl: config.hl,
  });
};

export const getChannelRelated = async (instance, channelId, continuation = '') => {
  if (!isNonEmptyString(channelId)) throw badRequest('channelId required');
  return fetchJsonFromInstance(instance, `/api/v1/channels/${encodeURIComponent(channelId)}/channels`, {
    continuation,
    hl: config.hl,
  });
};
