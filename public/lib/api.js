const cache = new Map();

const toQuery = (params = {}) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
};

const getCached = (cacheKey) => {
  const entry = cache.get(cacheKey);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(cacheKey);
    return null;
  }
  return entry.value;
};

const setCached = (cacheKey, value, ttlMs) => {
  if (!Number.isFinite(ttlMs) || ttlMs <= 0) return;
  cache.set(cacheKey, { value, expiresAt: Date.now() + ttlMs });
};

export const fetchJson = async (url, { cacheKey = url, signal, ttlMs = 0 } = {}) => {
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const response = await fetch(url, { headers: { accept: 'application/json' }, signal });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || `HTTP ${response.status}`);
    error.statusCode = response.status;
    error.details = payload.details;
    throw error;
  }
  setCached(cacheKey, payload, ttlMs);
  return payload;
};

export const api = {
  search: (query, filters = {}) => {
    const url = `/api/search${toQuery({ q: query, ...filters })}`;
    return fetchJson(url, { cacheKey: url });
  },
  suggestions: (query, signal) => {
    const url = `/api/search/suggestions${toQuery({ q: query })}`;
    return fetchJson(url, { cacheKey: url, signal, ttlMs: 5 * 60 * 1000 });
  },
  trending: (type = 'default', region = '') => {
    const url = `/api/trending${toQuery({ type, region })}`;
    return fetchJson(url, { cacheKey: url, ttlMs: 2 * 60 * 1000 });
  },
  watch: (id) => {
    const url = `/api/watch/${encodeURIComponent(id)}`;
    return fetchJson(url, { cacheKey: url });
  },
  watchComments: (id, continuation = '', instance = '') => {
    const url = `/api/watch/${encodeURIComponent(id)}/comments${toQuery({ continuation, instance })}`;
    return fetchJson(url, { cacheKey: url });
  },
  channel: (id, params = {}) => {
    const url = `/api/channel${toQuery({ id, ...params })}`;
    return fetchJson(url, { cacheKey: url });
  },
  thumbnail: (url) => `/api/thumbnail${toQuery({ url })}`,
};
