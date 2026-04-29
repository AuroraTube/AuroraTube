import { escapeHtml, formatCompactNumber, formatDuration, formatNumber, textBlock } from './lib/format.js';
import { avatar, channelCard, commentCard, isShortVideo, videoCard } from './lib/cards.js';
import { thumbnailUrl } from './lib/images.js';
import { playerMarkup } from './lib/player.js';

const pageShell = (body, title, query = '', active = 'home') => ({
  html: `
    <header class="topbar">
      <a class="brand" href="/" aria-label="AuroraTube ホーム">
        <span class="brand-mark">A</span>
        <span class="brand-name">AuroraTube</span>
      </a>

      <form id="search-form" class="search-form" autocomplete="off">
        <input id="search-input" name="q" type="search" value="${escapeHtml(query)}" placeholder="検索" aria-label="検索" />
        <button type="submit" class="search-submit" aria-label="検索">検索</button>
        <div class="search-suggestions" id="search-suggestions" hidden></div>
      </form>

      <nav class="topbar-actions" aria-label="主要ナビゲーション">
        <a class="topbar-link${active === 'home' ? ' active' : ''}" href="/">ホーム</a>
        <a class="topbar-link${active === 'trending' ? ' active' : ''}" href="/feed/trending">トレンド</a>
      </nav>
    </header>

    <main class="content">${body}</main>
  `,
  title,
});

const splitVideos = (items = []) => {
  const shorts = [];
  const videos = [];
  for (const item of items) {
    if (item?.type && item.type !== 'video' && !item.videoId) continue;
    if (isShortVideo(item)) shorts.push(item);
    else videos.push(item);
  }
  return { shorts, videos };
};

const sectionBlock = (title, items, variant = 'grid') => {
  if (!items.length) return '';
  return `
    <section class="section-block">
      <div class="section-head"><h2>${escapeHtml(title)}</h2></div>
      <section class="${variant}">${items.map((item) => videoCard(item, variant === 'short-grid' ? 'short' : 'grid')).join('')}</section>
    </section>
  `;
};


const playbackNotice = (playback = {}) => {
  const sourceUrl = String(playback.finalUrl || playback.sourceUrl || '');
  if (!sourceUrl) return '';
  const proxy = Boolean(playback.proxy);
  return `
    <section class="playback-note ${proxy ? 'is-proxied' : 'is-direct'}">
      <div>
        <strong>${proxy ? 'プロキシ再生' : '直接参照'}</strong>
        <p>${escapeHtml(proxy ? '再生はローカル経由です。' : playback.warning || '最終 URL は Google CDN を直接参照します。')}</p>
      </div>
      <code title="${escapeHtml(sourceUrl)}">${escapeHtml(sourceUrl)}</code>
    </section>
  `;
};

export const homePage = (trending, region = 'US') => {
  const { shorts, videos } = splitVideos(trending || []);
  return pageShell(`
    <section class="page-head">
      <div>
        <p class="eyebrow">ホーム</p>
        <h1>探索</h1>
      </div>
      <div class="page-head-meta">
        <span class="pill">${escapeHtml(region)}</span>
      </div>
    </section>
    ${sectionBlock('ショート動画', shorts, 'short-grid')}
    ${sectionBlock('注目の動画', videos, 'video-grid')}
    ${!shorts.length && !videos.length ? '<div class="empty">表示できるコンテンツがありません</div>' : ''}
  `, 'AuroraTube', '', 'home');
};

export const trendingPage = (trending, region = 'US') => {
  const { shorts, videos } = splitVideos(trending || []);
  return pageShell(`
    <section class="page-head">
      <div>
        <p class="eyebrow">トレンド</p>
        <h1>人気の動画</h1>
      </div>
      <div class="page-head-meta">
        <span class="pill">${escapeHtml(region)}</span>
      </div>
    </section>
    ${sectionBlock('ショート動画', shorts, 'short-grid')}
    ${sectionBlock('動画', videos, 'video-grid')}
    ${!shorts.length && !videos.length ? '<div class="empty">結果がありません</div>' : ''}
  `, 'トレンド - AuroraTube', '', 'trending');
};

export const searchPage = (query, filters, items = []) => {
  const { shorts, videos } = splitVideos(items);
  const channels = items.filter((item) => item.type === 'channel');
  return pageShell(`
    <section class="page-head">
      <div>
        <p class="eyebrow">検索</p>
        <h1>${escapeHtml(query)}</h1>
      </div>
      <div class="page-head-meta">
        <span class="pill">${escapeHtml(String(filters.type || 'all'))}</span>
        <span class="pill">${escapeHtml(String(filters.sort || 'relevance'))}</span>
        <span class="pill">${formatCompactNumber(items.length)} 件</span>
      </div>
    </section>
    ${sectionBlock('ショート動画', shorts, 'short-grid')}
    ${sectionBlock('動画', videos, 'video-grid')}
    ${channels.length ? `<section class="section-block"><div class="section-head"><h2>チャンネル</h2></div><div class="card-grid">${channels.map((item) => channelCard(item)).join('')}</div></section>` : ''}
    ${!items.length ? '<div class="empty">結果がありません</div>' : ''}
  `, `${query} - AuroraTube`, query, 'search');
};

export const watchPage = (payload = {}) => {
  const v = payload.video || {};
  const related = Array.isArray(payload.related) ? payload.related.slice(0, 16) : [];
  const comments = Array.isArray(payload.comments) ? payload.comments : [];
  const videoId = String(v.videoId || '');
  const poster = thumbnailUrl(v.thumbnail || '');
  const playback = v.playback || {};

  return pageShell(`
    <article class="viewer">
      ${playerMarkup({ videoId, poster, short: false, playback })}

      <section class="viewer-head">
        <div>
          <p class="eyebrow">視聴</p>
          <h1 class="watch-title">${escapeHtml(v.title || '')}</h1>
          <div class="watch-meta-row">
            <div class="watch-stats">
              <span>${v.viewCount ? `${formatCompactNumber(v.viewCount)} 回視聴` : '0 回視聴'}</span>
              <span>${v.publishedText ? escapeHtml(v.publishedText) : ''}</span>
              ${v.lengthSeconds ? `<span>${formatDuration(v.lengthSeconds)}</span>` : ''}
            </div>
          </div>
        </div>
        ${playbackNotice(playback)}
      </section>

      <a class="channel-strip" href="${v.authorId ? `/channel/${encodeURIComponent(v.authorId)}` : '#'}">
        <span class="channel-avatar">${avatar(v.authorThumbnails || [])}</span>
        <span class="channel-info">
          <strong class="channel-name">${escapeHtml(v.author || '')}</strong>
          <span class="channel-submeta">${escapeHtml(v.authorId || '')}</span>
        </span>
      </a>

      ${v.description ? `<section class="description-card"><div class="description">${textBlock(v.description)}</div></section>` : ''}

      <section class="comments-section">
        <div class="section-head">
          <h2>コメント</h2>
          <span class="count">${formatNumber(v.commentsCount || comments.length)} 件</span>
        </div>
        <div class="comments" data-comments>${comments.map((comment) => commentCard(comment)).join('') || '<div class="empty">コメントがありません</div>'}</div>
        ${payload.commentsContinuation ? `<button class="ghost-btn load-more" type="button" data-load-comments="${escapeHtml(payload.commentsContinuation)}" data-video-id="${escapeHtml(v.videoId || '')}">さらに表示</button>` : ''}
      </section>

      <section class="section-block">
        <div class="section-head"><h2>関連動画</h2></div>
        <div class="related-grid">${related.map((item) => videoCard(item, 'row')).join('') || '<div class="empty">関連動画がありません</div>'}</div>
      </section>
    </article>
  `, `${v.title || 'Watch'} - AuroraTube`, '', 'watch');
};

export const shortsPage = (payload = {}) => {
  const v = payload.video || {};
  const related = Array.isArray(payload.related) ? payload.related.slice(0, 12) : [];
  const videoId = String(v.videoId || '');
  const poster = thumbnailUrl(v.thumbnail || '');
  const playback = v.playback || {};

  return pageShell(`
    <article class="viewer viewer-short">
      ${playerMarkup({ videoId, poster, short: true, playback })}

      <section class="viewer-head">
        <div>
          <p class="eyebrow">ショート</p>
          <h1 class="watch-title">${escapeHtml(v.title || '')}</h1>
          <div class="watch-meta-row">
            <div class="watch-stats">
              <span>${v.viewCount ? `${formatCompactNumber(v.viewCount)} 回視聴` : '0 回視聴'}</span>
              ${v.lengthSeconds ? `<span>${formatDuration(v.lengthSeconds)}</span>` : ''}
            </div>
          </div>
        </div>
        ${playbackNotice(playback)}
      </section>

      <a class="channel-strip" href="${v.authorId ? `/channel/${encodeURIComponent(v.authorId)}` : '#'}">
        <span class="channel-avatar">${avatar(v.authorThumbnails || [])}</span>
        <span class="channel-info">
          <strong class="channel-name">${escapeHtml(v.author || '')}</strong>
          <span class="channel-submeta">${escapeHtml(v.authorId || '')}</span>
        </span>
      </a>

      <section class="section-block">
        <div class="section-head"><h2>関連動画</h2></div>
        <div class="related-grid">${related.map((item) => videoCard(item, 'short')).join('') || '<div class="empty">関連動画がありません</div>'}</div>
      </section>
    </article>
  `, `${v.title || 'Shorts'} - AuroraTube`, '', 'watch');
};

export const channelPage = (payload = {}) => {
  const header = payload.header || {};
  const videos = Array.isArray(payload.videos) ? payload.videos : [];

  return pageShell(`
    <section class="channel-page">
      <div class="channel-hero">
        ${header.banner ? `<div class="channel-banner"><img src="${escapeHtml(thumbnailUrl(header.banner))}" alt="" loading="lazy" referrerpolicy="no-referrer" /></div>` : ''}
        <div class="channel-profile">
          <div class="channel-profile-avatar">${avatar(header.avatar ? [{ url: header.avatar }] : [])}</div>
          <div class="channel-profile-copy">
            <p class="eyebrow">チャンネル</p>
            <h1>${escapeHtml(header.name || payload.title || payload.channelId || '')}</h1>
            <div class="channel-submeta">${escapeHtml(header.id || payload.channelId || '')}${header.subCountText ? ` • ${escapeHtml(header.subCountText)}` : ''}${header.verified ? ' • Verified' : ''}</div>
            ${header.description ? `<p class="channel-description">${escapeHtml(header.description)}</p>` : ''}
          </div>
        </div>
      </div>

      <section class="section-block">
        <div class="section-head">
          <h2>動画</h2>
          ${payload.continuation ? `<button class="ghost-btn" type="button" data-load-channel="${escapeHtml(payload.continuation)}" data-channel-id="${escapeHtml(payload.channelId || '')}" data-sort-by="${escapeHtml(payload.sortBy || 'newest')}">さらに表示</button>` : ''}
        </div>
        <section class="video-grid" data-channel-grid>${videos.map((item) => videoCard(item)).join('') || '<div class="empty">動画がありません</div>'}</section>
      </section>
    </section>
  `, `${header.name || payload.title || payload.channelId || 'Channel'} - AuroraTube`, '', 'channel');
};

export const notFoundPage = () => pageShell('<div class="empty large">ページが見つかりません。</div>', '404 - AuroraTube', '', 'home');
