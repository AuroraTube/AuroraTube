const toHttpUrl = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';
  if (text.startsWith('//')) return `${window.location.protocol}${text}`;
  try {
    const url = new URL(text, window.location.origin);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
};

export const thumbnailUrl = (url) => {
  const value = String(url || '').trim();
  if (!value) return '';
  if (value.startsWith('/api/thumbnail?url=')) return value;
  const absolute = toHttpUrl(value);
  if (!absolute) return '';
  return `/api/thumbnail?url=${encodeURIComponent(absolute)}`;
};

export const resolveImageUrl = (url) => thumbnailUrl(url);
