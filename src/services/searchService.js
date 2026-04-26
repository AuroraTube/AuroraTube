import { config } from '../config.js';
import { badRequest } from '../lib/httpError.js';
import { fetchFromAny, getTrending, searchInvidious } from '../providers/invidious.js';
import { normalizeSearchItem, normalizeVideoItem } from '../lib/media.js';
import { isNonEmptyString } from '../lib/strings.js';

export const fetchSearchPage = async (query, filters = {}) => {
  if (!isNonEmptyString(query)) throw badRequest('q required');
  const { data } = await searchInvidious(query, {
    page: filters.page || 1,
    sort: filters.sort || 'relevance',
    date: filters.date || '',
    duration: filters.duration || '',
    type: filters.type || 'all',
    features: filters.features || '',
    region: filters.region || config.region,
    hl: filters.hl || config.hl,
  });
  return Array.isArray(data) ? data.map((item) => normalizeSearchItem(item)) : [];
};

export const fetchTrendingPage = async (type = 'default', region = config.region) => {
  const { data } = await getTrending(type, region);
  return Array.isArray(data) ? data.map((item) => normalizeVideoItem(item)) : [];
};

export const fetchSearchSuggestions = async (query) => {
  if (!isNonEmptyString(query)) throw badRequest('q required');
  const { data } = await fetchFromAny('/api/v1/search/suggestions', { q: query });
  if (Array.isArray(data?.suggestions)) return data.suggestions.filter(isNonEmptyString);
  if (Array.isArray(data)) return data.filter(isNonEmptyString);
  return [];
};
