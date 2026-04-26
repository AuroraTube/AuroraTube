export const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const textBlock = (value) => escapeHtml(String(value ?? '')).replace(/\n/g, '<br />');

export const formatNumber = (value, locale = navigator.language || 'ja-JP') => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? new Intl.NumberFormat(locale).format(number) : '0';
};

export const formatCompactNumber = (value, locale = navigator.language || 'ja-JP') => {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '0';
  if (number < 1000) return new Intl.NumberFormat(locale).format(number);
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(number);
};

export const formatDuration = (seconds) => {
  const total = Number(seconds || 0);
  if (!total) return '';
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}` : `${minutes}:${String(secs).padStart(2, '0')}`;
};

export const timeAgo = (epochSeconds) => {
  const ts = Number(epochSeconds || 0) * 1000;
  if (!ts) return '';
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes} 分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 時間前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 日前`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} か月前`;
  const years = Math.floor(months / 12);
  return `${years} 年前`;
};

export const compactText = (value, maxLength = 140) => {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
};
