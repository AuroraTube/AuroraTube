import {
  compactText,
  escapeHtml,
  formatCompactNumber,
  formatDuration,
  textBlock,
  timeAgo,
} from './format.js';
import { thumbnailUrl } from './images.js';

const bestThumb = (item) =>
  item?.videoThumbnails?.slice?.().sort((a, b) => (Number(b.width || 0) * Number(b.height || 0)) - (Number(a.width || 0) * Number(a.height || 0)))[0]?.url || '';

const proxiedSrc = (url) => thumbnailUrl(url);

export const avatar = (thumbnails = [], fallback = '◉') => {
  const thumb = thumbnails?.[0]?.url || '';
  return thumb
    ? `<img src="${escapeHtml(proxiedSrc(thumb))}" alt="" loading="lazy" referrerpolicy="no-referrer" />`
    : `<span>${fallback}</span>`;
};

const metaLine = (item) => {
  const views = item.viewCount ? `${formatCompactNumber(item.viewCount)} 回視聴` : '';
  const published = item.publishedText ? item.publishedText : item.published ? timeAgo(item.published) : '';
  return [views, published].filter(Boolean).map(escapeHtml).join(' • ');
};

export const videoCard = (item, variant = 'grid') => {
  const thumb = bestThumb(item);
  const duration = formatDuration(item.lengthSeconds);
  const live = item.liveNow ? '<span class="badge live">LIVE</span>' : '';
  const url = item.videoId ? `/watch?v=${encodeURIComponent(item.videoId)}` : '#';
  const thumbImg = thumb ? `<img src="${escapeHtml(proxiedSrc(thumb))}" alt="${escapeHtml(item.title || '')}" loading="lazy" referrerpolicy="no-referrer" />` : '';
  const meta = metaLine(item);

  return `
    <article class="video-card ${variant === 'row' ? 'video-card-row' : 'video-card-grid'}">
      <a class="thumb" href="${url}">
        ${thumbImg}
        ${duration ? `<span class="duration">${escapeHtml(duration)}</span>` : ''}
        ${live}
      </a>
      <div class="video-meta">
        <a class="title ${variant === 'row' ? 'title-row' : ''}" href="${url}">${escapeHtml(item.title || '')}</a>
        <a class="channel-link" href="${item.authorId ? `/channel/${encodeURIComponent(item.authorId)}` : '#'}">${escapeHtml(item.author || '')}</a>
        ${meta ? `<div class="submeta">${meta}</div>` : ''}
        ${variant === 'row' && item.description ? `<p class="line-clamp">${escapeHtml(compactText(item.description || '', 180))}</p>` : ''}
      </div>
    </article>
  `;
};

export const channelCard = (item) => {
  const link = item.authorId ? `/channel/${encodeURIComponent(item.authorId)}` : '#';
  return `
    <article class="channel-card">
      <a href="${link}" class="channel-card-head">
        <span class="channel-card-avatar">${avatar(item.authorThumbnails)}</span>
        <span class="channel-card-copy">
          <div class="playlist-title">${escapeHtml(item.author || '')}</div>
          <div class="channel-submeta">${escapeHtml(item.authorId || '')}</div>
        </span>
      </a>
      <p class="channel-description">${escapeHtml(compactText(item.description || '', 140))}</p>
    </article>
  `;
};

export const commentCard = (comment) => `
  <article class="comment">
    <div class="comment-avatar">${avatar(comment.authorThumbnails)}</div>
    <div class="comment-body">
      <div class="comment-head">
        <strong>${escapeHtml(comment.author || '')}</strong>
        <span>${escapeHtml(comment.publishedText || '')}</span>
      </div>
      <div class="comment-text">${textBlock(comment.content || '')}</div>
    </div>
  </article>
`;
