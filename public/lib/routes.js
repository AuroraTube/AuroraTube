const stripTrailingSlash = (value) => {
  const text = String(value || '').trim();
  if (!text || text === '/') return '/';
  return text.endsWith('/') ? text.replace(/\/+$/, '') : text;
};

const setParams = (params = {}) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
};

export const buildWatchUrl = (videoId) => `/watch?v=${encodeURIComponent(String(videoId || ''))}`;
export const buildShortUrl = (videoId) => `/shorts/${encodeURIComponent(String(videoId || ''))}`;
export const buildChannelUrl = (channelId) => `/channel/${encodeURIComponent(String(channelId || ''))}`;
export const buildTrendingUrl = () => '/feed/trending';
export const buildSearchUrl = (query, filters = {}) => {
  const searchQuery = String(query || '').trim();
  return `/results${setParams({ search_query: searchQuery, ...filters })}`;
};

const extractPathData = (url) => {
  const path = stripTrailingSlash(url.pathname || '/');
  const segments = path.split('/').filter(Boolean);
  const first = segments[0] || '';

  if (path === '/') {
    return { route: 'home', path };
  }

  if (first === 'feed' && segments[1] === 'trending') {
    return { route: 'trending', path: '/feed/trending' };
  }

  if (first === 'results') {
    return { route: 'search', path: '/results' };
  }

  if (first === 'watch') {
    return { route: 'watch', path: '/watch', id: segments[1] ? decodeURIComponent(segments[1]) : '' };
  }

  if (first === 'shorts' && segments[1]) {
    return { route: 'shorts', path: `/shorts/${segments[1]}`, id: decodeURIComponent(segments[1]) };
  }

  if (first === 'channel' && segments[1]) {
    return { route: 'channel', path: `/channel/${segments[1]}`, id: decodeURIComponent(segments[1]) };
  }

  if (first.startsWith('@')) {
    return { route: 'channel', path: `/${first}`, id: decodeURIComponent(first) };
  }

  return { route: 'not-found', path };
};

export const parseClientRoute = (url) => {
  const current = url instanceof URL ? url : new URL(String(url || window.location.href));
  const route = extractPathData(current);

  if (route.route === 'watch') {
    const id = current.searchParams.get('v') || route.id || '';
    return { ...route, id: String(id || '').trim(), canonicalUrl: buildWatchUrl(id) };
  }

  if (route.route === 'shorts' || route.route === 'channel') {
    const id = route.id || '';
    return { ...route, id: String(id || '').trim(), canonicalUrl: route.route === 'shorts' ? buildShortUrl(id) : buildChannelUrl(id) };
  }

  if (route.route === 'search') {
    const query = String(current.searchParams.get('search_query') || '').trim();
    const filters = {
      type: current.searchParams.get('type') || 'all',
      sort: current.searchParams.get('sort') || 'relevance',
      date: current.searchParams.get('date') || '',
      duration: current.searchParams.get('duration') || '',
      features: current.searchParams.get('features') || '',
    };
    return {
      ...route,
      query,
      filters,
      canonicalUrl: query ? buildSearchUrl(query, filters) : buildTrendingUrl(),
    };
  }

  if (route.route === 'trending') {
    return { ...route, canonicalUrl: buildTrendingUrl() };
  }

  return { ...route, canonicalUrl: route.path };
};
