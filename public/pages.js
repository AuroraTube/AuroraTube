import { escapeHtml, formatCompactNumber, formatDuration, formatNumber, textBlock } from './lib/format.js';
import { avatar, channelCard, commentCard, videoCard } from './lib/cards.js';
import { thumbnailUrl } from './lib/images.js';

const bestThumb = (item) =>
  item?.videoThumbnails?.slice?.().sort((a, b) => (Number(b.width || 0) * Number(b.height || 0)) - (Number(a.width || 0) * Number(a.height || 0)))[0]?.url || '';

const proxiedSrc = (url) => thumbnailUrl(url);

const navLink = (href, label, active = false) => `
  <a class="topbar-link${active ? ' active' : ''}" href="${href}">${escapeHtml(label)}</a>
`;

const shell = (body, { query = '', active = 'home' } = {}) => `
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
      ${navLink('/', 'ホーム', active === 'home')}
      ${navLink('/search?q=trending', 'トレンド', active === 'search')}
    </nav>
  </header>

  <main class="content">
    ${body}
  </main>
`;

const pageShell = (body, title, query = '', active = 'home') => ({
  html: shell(body, { query, active }),
  title,
});

export const homePage = (trending, region = 'US') => {
  const videos = (trending || []).slice(0, 24).map((item) => videoCard(item)).join('');
  return pageShell(`
    <section class="page-head">
      <div>
        <p class="eyebrow">ホーム</p>
        <h1>今見られている動画</h1>
        <p class="page-copy">検索して、すぐ再生する。余計な導線を減らしたシンプルな一覧です。</p>
      </div>
      <div class="page-head-meta">
        <span class="pill">Region ${escapeHtml(region)}</span>
        <span class="pill">Trending</span>
      </div>
    </section>

    <section class="video-grid">${videos || '<div class="empty">結果がありません</div>'}</section>
  `, 'AuroraTube', '', 'home');
};

export const searchPage = (query, filters, items = []) => {
  const videos = items.filter((item) => item.type === 'video' || item.videoId);
  const channels = items.filter((item) => item.type === 'channel');

  return pageShell(`
    <section class="page-head">
      <div>
        <p class="eyebrow">検索</p>
        <h1>${escapeHtml(query)}</h1>
        <p class="page-copy">${formatCompactNumber(items.length)} 件の結果</p>
      </div>
      <div class="page-head-meta">
        <span class="pill">${escapeHtml(String(filters.type || 'all'))}</span>
        <span class="pill">${escapeHtml(String(filters.sort || 'relevance'))}</span>
      </div>
    </section>

    ${videos.length ? `<section class="video-grid">${videos.map((item) => videoCard(item)).join('')}</section>` : '<div class="empty">動画がありません</div>'}
    ${channels.length ? `<section class="section-block"><div class="section-head"><h2>チャンネル</h2></div><div class="card-grid">${channels.map((item) => channelCard(item)).join('')}</div></section>` : ''}
  `, `${query} - AuroraTube`, query, 'search');
};

export const watchPage = (payload = {}) => {
  const v = payload.video || {};
  const related = Array.isArray(payload.related) ? payload.related.slice(0, 16) : [];
  const comments = Array.isArray(payload.comments) ? payload.comments : [];
  const provider = payload.provider || {};
  const commentsProvider = payload.commentsProvider || {};
  const poster = proxiedSrc(v.thumbnail || '');

  return pageShell(`
    <article class="watch-page">
      <div class="player-shell">
        <video class="player" controls playsinline preload="metadata"${poster ? ` poster="${escapeHtml(poster)}"` : ''} src="/api/watch/${encodeURIComponent(v.videoId || '')}/stream"></video>
      </div>

      <section class="watch-head">
        <p class="eyebrow">視聴</p>
        <h1 class="watch-title">${escapeHtml(v.title || '')}</h1>
        <div class="watch-meta-row">
          <div class="watch-stats">
            <span>${v.viewCount ? `${formatCompactNumber(v.viewCount)} 回視聴` : '0 回視聴'}</span>
            <span>${v.publishedText ? escapeHtml(v.publishedText) : ''}</span>
            ${provider.label ? `<span>${escapeHtml(provider.label)}</span>` : provider.mode ? `<span>${escapeHtml(`ytDlp(${provider.mode})`)}</span>` : provider.instance ? `<span>${escapeHtml(provider.instance)}</span>` : ''}
            ${commentsProvider.label && commentsProvider.label !== provider.label ? `<span>comments: ${escapeHtml(commentsProvider.label)}</span>` : ''}
          </div>
        </div>
      </section>

      <a class="channel-strip" href="${v.authorId ? `/channel/${encodeURIComponent(v.authorId)}` : '#'}">
        <span class="channel-avatar">${avatar(v.authorThumbnails || [])}</span>
        <span class="channel-info">
          <strong class="channel-name">${escapeHtml(v.author || '')}</strong>
          <span class="channel-submeta">${escapeHtml(v.authorId || '')}</span>
        </span>
      </a>

      <section class="description-card">
        <div class="description-topline">
          <span>${v.lengthSeconds ? formatDuration(v.lengthSeconds) : ''}</span>
          <span>${v.rating ? escapeHtml(String(v.rating)) : ''}</span>
        </div>
        <div class="description">${v.description ? textBlock(v.description) : '<p>説明がありません。</p>'}</div>
      </section>

      <section class="comments-section">
        <div class="section-head">
          <h2>コメント</h2>
          <span class="count" data-comment-count>${formatNumber(v.commentsCount || comments.length)} 件</span>
        </div>
        <div class="comments" data-comments>${comments.map((comment) => commentCard(comment)).join('') || '<div class="empty">コメントがありません</div>'}</div>
        ${payload.commentsContinuation ? `<button class="ghost-btn load-more" type="button" data-load-comments="${escapeHtml(payload.commentsContinuation)}" data-video-id="${escapeHtml(v.videoId || '')}" data-comments-instance="${escapeHtml(commentsProvider.instance || '')}">さらに表示</button>` : ''}
      </section>

      <section class="section-block">
        <div class="section-head"><h2>関連動画</h2></div>
        <div class="related-grid">${related.map((item) => videoCard(item, 'row')).join('') || '<div class="empty">関連動画がありません</div>'}</div>
      </section>
    </article>
  `, `${v.title || 'Watch'} - AuroraTube`, '', 'watch');
};

export const channelPage = (payload = {}) => {
  const header = payload.header || {};
  const videos = Array.isArray(payload.videos) ? payload.videos : [];

  return pageShell(`
    <section class="channel-page">
      <div class="channel-hero">
        ${header.banner ? `<div class="channel-banner"><img src="${escapeHtml(proxiedSrc(header.banner))}" alt="" loading="lazy" referrerpolicy="no-referrer" /></div>` : ''}
        <div class="channel-profile">
          <div class="channel-profile-avatar">${avatar(header.avatar ? [{ url: header.avatar }] : [])}</div>
          <div class="channel-profile-copy">
            <p class="eyebrow">チャンネル</p>
            <h1>${escapeHtml(header.name || payload.title || payload.channelId || '')}</h1>
            <div class="channel-submeta">${escapeHtml(header.id || payload.channelId || '')}${header.subCountText ? ` • ${escapeHtml(header.subCountText)}` : ''}${header.verified ? ' • Verified' : ''}</div>
            <p class="channel-description">${escapeHtml(header.description || '')}</p>
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
