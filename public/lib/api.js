const cache = new Map();
const DEFAULT_TIMEOUT_MS = 15000;

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

const createTimeoutSignal = (signal, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), timeoutMs);

  const forwardAbort = () => controller.abort(signal?.reason || new DOMException('Aborted', 'AbortError'));
  if (signal) {
    if (signal.aborted) {
      forwardAbort();
    } else {
      signal.addEventListener('abort', forwardAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      if (signal) signal.removeEventListener('abort', forwardAbort);
    },
  };
};

export const fetchJson = async (url, { cacheKey = url, signal, ttlMs = 0, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) => {
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { signal: timedSignal, cleanup } = createTimeoutSignal(signal, timeoutMs);
  try {
    const response = await fetch(url, { headers: { accept: 'application/json' }, signal: timedSignal });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || `HTTP ${response.status}`);
      error.statusCode = response.status;
      error.details = payload.details;
      throw error;
    }
    setCached(cacheKey, payload, ttlMs);
    return payload;
  } finally {
    cleanup();
  }
};

export const api = {
  search: (query, filters = {}, signal) => {
    const url = `/api/search${toQuery({ q: query, ...filters })}`;
    return fetchJson(url, { cacheKey: url, signal });
  },
  suggestions: (query, signal) => {
    const url = `/api/search/suggestions${toQuery({ q: query })}`;
    return fetchJson(url, { cacheKey: url, signal, ttlMs: 5 * 60 * 1000 });
  },
  trending: (type = 'default', region = '', signal) => {
    const url = `/api/trending${toQuery({ type, region })}`;
    return fetchJson(url, { cacheKey: url, signal, ttlMs: 2 * 60 * 1000 });
  },
  watch: (id, { quality = '' } = {}, signal) => {
    const url = `/api/watch/${encodeURIComponent(id)}${toQuery({ quality })}`;
    return fetchJson(url, { cacheKey: url, signal });
  },
  watchComments: (id, continuation = '', signal) => {
    const url = `/api/watch/${encodeURIComponent(id)}/comments${toQuery({ continuation })}`;
    return fetchJson(url, { cacheKey: url, signal });
  },
  channel: (id, params = {}, signal) => {
    const url = `/api/channel${toQuery({ id, ...params })}`;
    return fetchJson(url, { cacheKey: url, signal });
  },
};
