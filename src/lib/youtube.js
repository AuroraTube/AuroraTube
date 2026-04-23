import { youtubeIdPattern } from '../config.js';

const idFromPathSegments = (segments) => {
  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    if (segment === 'shorts' || segment === 'embed' || segment === 'live' || segment === 'v') {
      const candidate = segments[i + 1];
      if (youtubeIdPattern.test(candidate || '')) return candidate;
    }
  }
  return null;
};

export const extractYouTubeVideoId = (input) => {
  const text = String(input ?? '').trim();
  if (!text) return null;
  if (youtubeIdPattern.test(text)) return text;

  const normalized = /^https?:\/\//i.test(text) ? text : `https://${text}`;

  let url;
  try {
    url = new URL(normalized);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./i, '').toLowerCase();
  const pathnameSegments = url.pathname.split('/').filter(Boolean);

  if (host === 'youtu.be') {
    const candidate = pathnameSegments[0];
    return youtubeIdPattern.test(candidate || '') ? candidate : null;
  }

  if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
    const searchId = url.searchParams.get('v');
    if (youtubeIdPattern.test(searchId || '')) return searchId;

    const pathId = idFromPathSegments(pathnameSegments);
    if (pathId) return pathId;
  }

  return null;
};

export const isHttpUrl = (value) => {
  if (!isNonEmptyString(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};
