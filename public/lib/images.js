const isHttpUrl = (value) => {
  try {
    const parsed = new URL(String(value || ''), window.location.origin);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const thumbnailUrl = (url) => {
  const value = String(url || '').trim();
  if (!value) return '';
  if (value.startsWith('/api/thumbnail?url=')) return value;
  if (!isHttpUrl(value)) return '';
  return `/api/thumbnail?url=${encodeURIComponent(value)}`;
};
