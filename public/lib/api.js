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

export const fetchJson = async (url, { cacheKey = url, signal } = {}) => {
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const response = await fetch(url, { headers: { accept: 'application/json' }, signal });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || `HTTP ${response.status}`);
    error.statusCode = response.status;
    error.details = payload.details;
    throw error;
  }
  cache.set(cacheKey, payload);
  return payload;
};

export const api = {
  search: (query, filters = {}) => {
    const url = `/api/search${toQuery({ q: query, ...filters })}`;
    return fetchJson(url, { cacheKey: url });
  },
  suggestions: (query, signal) => {
    const url = `/api/search/suggestions${toQuery({ q: query })}`;
    return fetchJson(url, { cacheKey: url, signal });
  },
  trending: (type = 'default', region = '') => {
    const url = `/api/trending${toQuery({ type, region })}`;
    return fetchJson(url, { cacheKey: url });
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
};
