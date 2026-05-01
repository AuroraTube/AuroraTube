const ensureUrl = (value) => {
  try {
    return new URL(String(value || ''), window.location.origin);
  } catch {
    return null;
  }
};

const decodePathPart = (value = '') => {
  try {
    return decodeURIComponent(String(value || ''));
  } catch {
    return String(value || '');
  }
};

const buildSearchParams = (params = {}) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  return search;
};

export const buildHomeUrl = () => '/';

export const buildResultsUrl = (query = '', filters = {}) => {
  const search = buildSearchParams({ search_query: query, ...filters });
  const suffix = search.toString();
  return suffix ? `/results?${suffix}` : '/results';
};

export const buildWatchUrl = (videoId = '', filters = {}) => {
  const search = buildSearchParams({ v: videoId, quality: filters.quality });
  const suffix = search.toString();
  return suffix ? `/watch?${suffix}` : '/watch';
};

export const buildShortsUrl = (videoId = '') => {
  const value = String(videoId || '').trim();
  return value ? `/shorts/${encodeURIComponent(value)}` : '/shorts';
};

export const buildChannelUrl = (channelId = '') => `/channel/${encodeURIComponent(String(channelId || ''))}`;

export const parseAppRoute = (value) => {
  const url = value instanceof URL ? value : ensureUrl(value);
  if (!url) return { route: 'not-found' };

  const { pathname, searchParams } = url;
  if (pathname === '/' || pathname === '') {
    return { route: 'home' };
  }

  if (pathname === '/results') {
    const query = String(searchParams.get('search_query') || searchParams.get('q') || '').trim();
    return {
      route: 'results',
      query,
      filters: {
        sort: String(searchParams.get('sort') || 'relevance').trim() || 'relevance',
        date: String(searchParams.get('date') || '').trim(),
        duration: String(searchParams.get('duration') || '').trim(),
        type: String(searchParams.get('type') || 'all').trim() || 'all',
        features: String(searchParams.get('features') || '').trim(),
      },
    };
  }

  if (pathname === '/watch') {
    return {
      route: 'watch',
      videoId: String(searchParams.get('v') || '').trim(),
      quality: String(searchParams.get('quality') || '').trim(),
    };
  }

  if (pathname === '/shorts') {
    return { route: 'shorts-feed' };
  }

  if (pathname.startsWith('/shorts/')) {
    return {
      route: 'shorts',
      videoId: decodePathPart(pathname.slice('/shorts/'.length)),
    };
  }

  if (pathname.startsWith('/channel/')) {
    return {
      route: 'channel',
      channelId: decodePathPart(pathname.slice('/channel/'.length)),
      sortBy: String(searchParams.get('sortBy') || searchParams.get('sort_by') || 'newest').trim() || 'newest',
    };
  }

  if (pathname.startsWith('/@')) {
    return {
      route: 'channel',
      channelId: decodePathPart(pathname.slice(1)),
      sortBy: String(searchParams.get('sortBy') || searchParams.get('sort_by') || 'newest').trim() || 'newest',
    };
  }

  return { route: 'not-found' };
};
