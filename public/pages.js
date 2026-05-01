import { escapeHtml, formatCompactNumber, formatDuration, formatNumber, textBlock } from './lib/format.js';
import { avatar, channelCard, commentCard, isShortVideo, playlistCard, videoCard } from './lib/cards.js';
import { thumbnailUrl } from './lib/images.js';
import { playerMarkup } from './lib/player.js';
import { buildHomeUrl, buildResultsUrl, buildShortsUrl, buildChannelUrl } from './lib/routes.js';

const navItems = [
  { label: 'ホーム', href: buildHomeUrl(), key: 'home' },
  { label: 'ショート', href: buildShortsUrl(''), key: 'shorts' },
];

const pageShell = (body, title, query = '', active = 'home') => ({
  html: `
    <header class="topbar">
      <div class="topbar-left">
        <button class="menu-button" type="button" aria-label="メニュー">☰</button>
        <a class="brand" href="${buildHomeUrl()}" aria-label="AuroraTube ホーム">
          <span class="brand-mark">▶</span>
          <span class="brand-name">AuroraTube</span>
        </a>
      </div>

      <form id="search-form" class="search-form" autocomplete="off">
        <input id="search-input" name="q" type="search" value="${escapeHtml(query)}" placeholder="検索" aria-label="検索" />
        <button type="submit" class="search-submit" aria-label="検索">検索</button>
        <div class="search-suggestions" id="search-suggestions" hidden></div>
      </form>

      <div class="topbar-actions" aria-label="アクション">
        <a class="icon-chip ${active === 'shorts' ? 'active' : ''}" href="${buildShortsUrl('')}">ショート</a>
        <a class="icon-chip ${active === 'home' ? 'active' : ''}" href="${buildHomeUrl()}">ホーム</a>
      </div>
    </header>

    <div class="app-shell">
      <aside class="sidebar" aria-label="ナビゲーション">
        ${navItems.map((item) => `<a class="sidebar-link${active === item.key ? ' active' : ''}" href="${item.href}">${escapeHtml(item.label)}</a>`).join('')}
      </aside>
      <main class="content">${body}</main>
    </div>
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

const channelSections = (items = []) => {
  const channels = items.filter((item) => item.type === 'channel');
  if (!channels.length) return '';
  return `<section class="section-block"><div class="section-head"><h2>チャンネル</h2></div><div class="card-grid">${channels.map((item) => channelCard(item)).join('')}</div></section>`;
};

const playlistSections = (items = []) => {
  const playlists = items.filter((item) => item.type === 'playlist');
  if (!playlists.length) return '';
  return `<section class="section-block"><div class="section-head"><h2>再生リスト</h2></div><div class="card-grid">${playlists.map((item) => playlistCard({ ...item, videos: item.videos || [] })).join('')}</div></section>`;
};

const playbackNotice = (playback = {}) => {
  const sourceUrl = String(playback.finalUrl || playback.sourceUrl || playback.playUrl || '');
  if (!sourceUrl) return '';
  const proxy = Boolean(playback.proxy);
  return `
    <section class="playback-note ${proxy ? 'is-proxied' : 'is-direct'}">
      <div>
        <strong>${proxy ? 'プロキシ再生' : '直接再生'}</strong>
        <p>${escapeHtml(proxy ? '再生はローカル経由です。' : playback.warning || '直接参照のまま再生します。')}</p>
      </div>
      <code title="${escapeHtml(sourceUrl)}">${escapeHtml(sourceUrl)}</code>
    </section>
  `;
};

const filterChips = (filters = {}) => {
  const chips = [
    ['全て', buildResultsUrl(filters.query || ''), !filters.type || filters.type === 'all'],
    ['動画', buildResultsUrl(filters.query || '', { type: 'video' }), filters.type === 'video'],
    ['短尺', buildResultsUrl(filters.query || '', { type: 'short' }), filters.type === 'short'],
    ['チャンネル', buildResultsUrl(filters.query || '', { type: 'channel' }), filters.type === 'channel'],
  ];
  return `<div class="chip-row">${chips.map(([label, href, active]) => `<a class="chip${active ? ' active' : ''}" href="${href}">${escapeHtml(label)}</a>`).join('')}</div>`;
};

export const homePage = (trending, region = 'US') => {
  const { shorts, videos } = splitVideos(trending || []);
  return pageShell(`
    <section class="page-head">
      <div>
        <p class="eyebrow">ホーム</p>
        <h1>おすすめ</h1>
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

export const searchPage = (query, filters, items = []) => {
  const { shorts, videos } = splitVideos(items);
  const channels = items.filter((item) => item.type === 'channel');
  const playlists = items.filter((item) => item.type === 'playlist');
  return pageShell(`
    <section class="page-head">
      <div>
        <p class="eyebrow">検索結果</p>
        <h1>${escapeHtml(query || '検索')}</h1>
      </div>
      <div class="page-head-meta">
        <span class="pill">${escapeHtml(String(filters.type || 'all'))}</span>
        <span class="pill">${escapeHtml(String(filters.sort || 'relevance'))}</span>
        <span class="pill">${formatCompactNumber(items.length)} 件</span>
      </div>
    </section>
    ${filterChips({ ...filters, query })}
    ${sectionBlock('ショート動画', shorts, 'short-grid')}
    ${sectionBlock('動画', videos, 'video-grid')}
    ${channelSections(channels)}
    ${playlistSections(playlists)}
    ${!items.length ? '<div class="empty">結果がありません</div>' : ''}
  `, `${query || '検索'} - AuroraTube`, query, 'home');
};


export const shortsFeedPage = (items = [], region = 'US') => {
  const { shorts } = splitVideos(items || []);
  return pageShell(`
    <section class="page-head">
      <div>
        <p class="eyebrow">ショート</p>
        <h1>フィード</h1>
      </div>
      <div class="page-head-meta">
        <span class="pill">${escapeHtml(region)}</span>
      </div>
    </section>
    ${sectionBlock('ショート動画', shorts, 'short-grid')}
    ${!shorts.length ? '<div class="empty">表示できるショート動画がありません</div>' : ''}
  `, 'ショート - AuroraTube', '', 'shorts');
};

export const watchPage = (payload = {}) => {
  const v = payload.video || {};
  const related = Array.isArray(payload.related) ? payload.related.slice(0, 16) : [];
  const comments = Array.isArray(payload.comments) ? payload.comments : [];
  const videoId = String(v.videoId || '');
  const poster = thumbnailUrl(v.thumbnail || '');
  const playback = v.playback || {};

  return pageShell(`
    <article class="viewer viewer-watch">
      ${playerMarkup({ videoId, poster, short: false, playback })}

      <section class="viewer-head">
        <div class="watch-copy">
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

      <a class="channel-strip" href="${v.authorId ? buildChannelUrl(v.authorId) : '#'}">
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

      <aside class="watch-related-column">
        <section class="section-block">
          <div class="section-head"><h2>関連動画</h2></div>
          <div class="related-grid">${related.map((item) => videoCard(item, 'row')).join('') || '<div class="empty">関連動画がありません</div>'}</div>
        </section>
      </aside>
    </article>
  `, `${v.title || 'Watch'} - AuroraTube`, '', 'home');
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
        <div class="watch-copy">
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

      <a class="channel-strip" href="${v.authorId ? buildChannelUrl(v.authorId) : '#'}">
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
  `, `${v.title || 'Shorts'} - AuroraTube`, '', 'shorts');
};

export const channelPage = (payload = {}) => {
  const header = payload.header || {};
  const videos = Array.isArray(payload.videos) ? payload.videos : [];
  const playlists = Array.isArray(payload.playlists) ? payload.playlists : [];
  const relatedChannels = Array.isArray(payload.relatedChannels) ? payload.relatedChannels : [];
  const tabs = [
    ['動画', true],
    ['再生リスト', playlists.length > 0],
    ['チャンネル', relatedChannels.length > 0],
  ];

  return pageShell(`
    <section class="channel-page">
      <div class="channel-hero">
        ${header.banner ? `<div class="channel-banner"><img src="${escapeHtml(thumbnailUrl(header.banner))}" alt="" loading="lazy" referrerpolicy="no-referrer" /></div>` : ''}
        <div class="channel-profile">
          <span class="channel-profile-avatar">${avatar(header.avatar ? [{ url: header.avatar }] : [])}</span>
          <div class="channel-profile-copy">
            <p class="eyebrow">チャンネル</p>
            <h1>${escapeHtml(header.name || payload.channelId || '')}</h1>
            <div class="channel-profile-meta">
              <span>${escapeHtml(header.subCountText || '')}</span>
              <span>${header.videoCount ? `${formatCompactNumber(header.videoCount)} 本` : ''}</span>
              ${header.verified ? '<span class="pill">認証済み</span>' : ''}
            </div>
          </div>
        </div>
      </div>

      <div class="channel-tabs">${tabs.map(([label, visible]) => visible ? `<span class="chip active">${escapeHtml(label)}</span>` : '').join('')}</div>

      <section class="section-block">
        <div class="section-head">
          <h2>動画</h2>
          <span class="count">${formatNumber(videos.length)} 件</span>
        </div>
        <div class="video-grid" data-channel-grid>${videos.map((item) => videoCard(item)).join('') || '<div class="empty">動画がありません</div>'}</div>
        ${payload.continuation ? `<button class="ghost-btn load-more" type="button" data-load-channel="${escapeHtml(payload.continuation)}" data-channel-id="${escapeHtml(payload.channelId || '')}" data-sort-by="${escapeHtml(payload.sortBy || 'newest')}">さらに表示</button>` : ''}
      </section>

      ${playlists.length ? `<section class="section-block"><div class="section-head"><h2>再生リスト</h2></div><div class="card-grid">${playlists.map((item) => playlistCard(item)).join('')}</div></section>` : ''}
      ${relatedChannels.length ? `<section class="section-block"><div class="section-head"><h2>関連チャンネル</h2></div><div class="card-grid">${relatedChannels.map((item) => channelCard(item)).join('')}</div></section>` : ''}
    </section>
  `, `${header.name || payload.channelId || 'Channel'} - AuroraTube`, '', 'home');
};

export const notFoundPage = () => pageShell(`
  <section class="empty large">
    <strong>ページが見つかりません</strong>
  </section>
`, '404 - AuroraTube', '', 'home');
