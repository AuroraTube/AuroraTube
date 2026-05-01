import {
  compactText,
  escapeHtml,
  formatCompactNumber,
  formatDuration,
  textBlock,
  timeAgo,
} from './format.js';
import { buildChannelUrl, buildShortsUrl, buildWatchUrl } from './routes.js';
import { thumbnailUrl } from './images.js';

const bestThumb = (item) => {
  const thumbs = Array.isArray(item?.videoThumbnails) ? item.videoThumbnails : [];
  return [...thumbs].sort((a, b) => (Number(b.width || 0) * Number(b.height || 0)) - (Number(a.width || 0) * Number(a.height || 0)))[0]?.url || '';
};

const imageTag = (url, alt = '', className = '', fallback = '') => {
  const resolved = thumbnailUrl(url);
  if (!resolved) return fallback;
  return `<img class="${className}" src="${escapeHtml(resolved)}" alt="${escapeHtml(alt)}" loading="lazy" referrerpolicy="no-referrer" />`;
};

export const isShortVideo = (item) => {
  const length = Number(item?.lengthSeconds || 0);
  return Number.isFinite(length) && length > 0 && length <= 60;
};

const videoHref = (item, variant = 'grid') => {
  if (!item?.videoId) return '#';
  return variant === 'short' || isShortVideo(item) ? buildShortsUrl(item.videoId) : buildWatchUrl(item.videoId);
};

export const avatar = (thumbnails = [], fallback = '◉') => {
  const thumb = Array.isArray(thumbnails) ? thumbnails[0]?.url || '' : '';
  return thumb
    ? imageTag(thumb, '', 'avatar-image', `<span>${escapeHtml(fallback)}</span>`)
    : `<span>${escapeHtml(fallback)}</span>`;
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
  const url = videoHref(item, variant);
  const short = variant === 'short' || isShortVideo(item);
  const thumbImg = thumb ? imageTag(thumb, item.title || '', 'card-thumb') : '';
  const meta = metaLine(item);

  return `
    <article class="video-card ${short ? 'short-card' : variant === 'row' ? 'video-card-row' : 'video-card-grid'}">
      <a class="thumb" href="${url}">
        ${thumbImg}
        ${duration ? `<span class="duration">${escapeHtml(duration)}</span>` : ''}
        ${live}
      </a>
      <div class="video-meta">
        <a class="title ${variant === 'row' ? 'title-row' : ''}" href="${url}">${escapeHtml(item.title || '')}</a>
        <a class="channel-link" href="${item.authorId ? buildChannelUrl(item.authorId) : '#'}">${escapeHtml(item.author || '')}</a>
        ${meta ? `<div class="submeta">${meta}</div>` : ''}
        ${variant === 'row' && item.description ? `<p class="line-clamp">${escapeHtml(compactText(item.description || '', 180))}</p>` : ''}
      </div>
    </article>
  `;
};

export const channelCard = (item) => {
  const link = item.authorId ? buildChannelUrl(item.authorId) : '#';
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


export const playlistCard = (item = {}) => {
  const firstVideoId = item.videos?.[0]?.videoId || item.videoId || '';
  const link = firstVideoId ? buildWatchUrl(firstVideoId) : '#';
  const thumb = item.playlistThumbnail || item.videoThumbnails?.[0]?.url || '';
  const cover = thumb ? imageTag(thumb, item.title || '', 'card-thumb') : '';
  return `
    <article class="playlist-card">
      <a class="thumb" href="${link}">
        ${cover}
      </a>
      <div class="video-meta">
        <a class="title" href="${link}">${escapeHtml(item.title || '')}</a>
        <div class="submeta">${escapeHtml(item.author || '')}${item.videoCount ? ` • ${formatCompactNumber(item.videoCount)} 本` : ''}</div>
      </div>
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
