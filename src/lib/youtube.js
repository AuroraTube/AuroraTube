const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;
const channelHandlePattern = /^@?[a-zA-Z0-9._-]{2,}$/;

const extractFromSegments = (segments) => {
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    if (['shorts', 'embed', 'live', 'v'].includes(segment)) {
      const candidate = segments[index + 1];
      if (YOUTUBE_ID_PATTERN.test(candidate || '')) return candidate;
    }
  }
  return null;
};

export const safeVideoId = (value) => (YOUTUBE_ID_PATTERN.test(String(value || '')) ? String(value) : null);

export const extractYouTubeVideoId = (input) => {
  const text = String(input ?? '').trim();
  if (!text) return null;
  if (YOUTUBE_ID_PATTERN.test(text)) return text;

  const normalized = /^https?:\/\//i.test(text) ? text : `https://${text}`;
  let url;
  try {
    url = new URL(normalized);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./i, '').toLowerCase();
  const segments = url.pathname.split('/').filter(Boolean);

  if (host === 'youtu.be') {
    const candidate = segments[0];
    return YOUTUBE_ID_PATTERN.test(candidate || '') ? candidate : null;
  }

  if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
    const searchId = url.searchParams.get('v');
    if (YOUTUBE_ID_PATTERN.test(searchId || '')) return searchId;
    const pathId = extractFromSegments(segments);
    if (pathId) return pathId;
  }

  return null;
};

export const extractChannelHandle = (input) => {
  const text = String(input ?? '').trim();
  if (!text) return null;

  if (text.startsWith('@') && channelHandlePattern.test(text)) return text;

  const normalized = /^https?:\/\//i.test(text) ? text : `https://${text}`;
  try {
    const url = new URL(normalized);
    const host = url.hostname.replace(/^www\./i, '').toLowerCase();
    const segments = url.pathname.split('/').filter(Boolean);

    if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      if (segments[0] === 'channel' && segments[1]) return segments[1];
      if (segments[0] === 'c' && segments[1]) return segments[1];
      if (segments[0]?.startsWith('@')) return segments[0];
    }
  } catch {
    return null;
  }

  return channelHandlePattern.test(text) ? (text.startsWith('@') ? text : `@${text}`) : null;
};

export const isHttpUrl = (value) => {
  try {
    const url = new URL(String(value || '').trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};
