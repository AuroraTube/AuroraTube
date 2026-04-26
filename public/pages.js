import {
  escapeHtml,
  compactText,
  formatDuration,
  formatNumber,
  formatCompactNumber,
  textBlock,
  timeAgo,
} from './lib/format.js';

const bestThumb = (item) =>
  item?.videoThumbnails?.slice?.().sort((a, b) => (Number(b.width || 0) * Number(b.height || 0)) - (Number(a.width || 0) * Number(a.height || 0)))[0]?.url || '';

const avatar = (thumbnails = [], fallback = '◉') => {
  const thumb = thumbnails?.[0]?.url || '';
  return thumb ? `<img src="${escapeHtml(thumb)}" alt="" loading="lazy" />` : `<span>${fallback}</span>`;
};

const icon = (name) => {
  const icons = {
    menu: '<path d="M4 7h16M4 12h16M4 17h16" />',
    search: '<path d="M21 21l-4.2-4.2" /><circle cx="11" cy="11" r="7" />',
    mic: '<path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z" /><path d="M19 11a7 7 0 0 1-14 0" /><path d="M12 18v3" />',
    upload: '<path d="M12 3v12" /><path d="m7 8 5-5 5 5" /><path d="M5 21h14" />',
    bell: '<path d="M15 17H5l1.5-1.5A3 3 0 0 0 7 13.4V11a5 5 0 0 1 10 0v2.4a3 3 0 0 0 .5 1.7L19 17Z" /><path d="M10 17a2 2 0 0 0 4 0" />',
    more: '<circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />',
    like: '<path d="M7 11v10H4V11Z" /><path d="M7 11l4-7 1 1.5V11h6a2 2 0 0 1 2 2v1l-2 7H7" />',
    share: '<path d="M16 8a3 3 0 1 0-2.8-4" /><path d="M8 13l8-4" /><path d="M16 20a3 3 0 1 0 2.8-4" />',
    save: '<path d="M6 3h12v18l-6-3-6 3Z" />',
    clip: '<path d="M8 7a4 4 0 1 1 6.5 3.1L9 15.6A2.5 2.5 0 0 1 5.5 12l7-7A5.5 5.5 0 1 1 20 9" />',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.more}</svg>`;
};

const navItem = (href, label, active = false) => `
  <a class="nav-item${active ? ' active' : ''}" href="${href}">
    <span class="nav-dot">${active ? '▸' : '•'}</span>
    <span>${label}</span>
  </a>
`;

export const shell = (body, { query = '', active = 'home' } = {}) => `
  <header class="topbar">
    <div class="topbar-left">
      <button class="icon-btn" type="button" aria-label="メニュー" disabled>${icon('menu')}</button>
      <a class="brand" href="/" aria-label="AuroraTube ホーム">
        <span class="brand-mark">A</span>
        <span class="brand-name">AuroraTube</span>
      </a>
    </div>

    <div class="search-shell">
      <form id="search-form" class="search-form" autocomplete="off">
        <input id="search-input" name="q" type="search" value="${escapeHtml(query)}" placeholder="検索" aria-label="検索" />
        <button type="submit" class="search-submit" aria-label="検索">${icon('search')}</button>
      </form>
      <button class="icon-btn mic-btn" type="button" aria-label="音声検索" disabled>${icon('mic')}</button>
      <div class="search-suggestions" id="search-suggestions" hidden></div>
    </div>

    <div class="topbar-right">
      <button class="icon-btn" type="button" aria-label="アップロード" disabled>${icon('upload')}</button>
      <button class="icon-btn" type="button" aria-label="通知" disabled>${icon('bell')}</button>
      <button class="avatar-btn" type="button" aria-label="アカウント" disabled>Y</button>
    </div>
  </header>

  <div class="layout">
    <aside class="sidebar">
      <nav class="sidebar-section">
        ${navItem('/', 'ホーム', active === 'home')}
        ${navItem('/search?q=trending', 'トレンド', active === 'search')}
        ${navItem('/search?q=music', '音楽', false)}
        ${navItem('/search?q=gaming', 'ゲーム', false)}
        ${navItem('/search?q=news', 'ニュース', false)}
        ${navItem('/search?q=live', 'ライブ', false)}
      </nav>
      <div class="sidebar-footer">
        <p>Invidious ベース</p>
        <p>検索・視聴・チャンネル</p>
      </div>
    </aside>

    <main class="content">
      ${body}
    </main>
  </div>
`;

export const videoCard = (item, size = 'grid') => {
  const thumb = bestThumb(item);
  const duration = formatDuration(item.lengthSeconds);
  const live = item.liveNow ? '<span class="badge live">LIVE</span>' : '';
  const url = item.videoId ? `/watch?v=${encodeURIComponent(item.videoId)}` : '#';
  const views = item.viewCount ? `${formatCompactNumber(item.viewCount)} 回視聴` : '';
  const published = item.publishedText ? item.publishedText : item.published ? timeAgo(item.published) : '';
  return `
    <article class="video-card ${size}">
      <a class="thumb" href="${url}">
        <img src="${escapeHtml(thumb)}" alt="${escapeHtml(item.title || '')}" loading="lazy" />
        ${duration ? `<span class="duration">${escapeHtml(duration)}</span>` : ''}
        ${live}
      </a>
      <div class="video-meta">
        <a class="title" href="${url}">${escapeHtml(item.title || '')}</a>
        <a class="channel-link" href="${item.authorId ? `/channel/${encodeURIComponent(item.authorId)}` : '#'}">${escapeHtml(item.author || '')}</a>
        <div class="submeta">${[views, published].filter(Boolean).map(escapeHtml).join(' • ')}</div>
      </div>
    </article>
  `;
};

export const videoRow = (item) => {
  const thumb = bestThumb(item);
  const duration = formatDuration(item.lengthSeconds);
  const url = item.videoId ? `/watch?v=${encodeURIComponent(item.videoId)}` : '#';
  const views = item.viewCount ? `${formatCompactNumber(item.viewCount)} 回視聴` : '';
  const published = item.publishedText ? item.publishedText : item.published ? timeAgo(item.published) : '';
  return `
    <article class="video-row">
      <a class="thumb thumb-row" href="${url}">
        <img src="${escapeHtml(thumb)}" alt="${escapeHtml(item.title || '')}" loading="lazy" />
        ${duration ? `<span class="duration">${escapeHtml(duration)}</span>` : ''}
      </a>
      <div class="video-row-meta">
        <a class="title title-large" href="${url}">${escapeHtml(item.title || '')}</a>
        <div class="submeta-row">
          <a class="channel-link" href="${item.authorId ? `/channel/${encodeURIComponent(item.authorId)}` : '#'}">${escapeHtml(item.author || '')}</a>
          <span>${[views, published].filter(Boolean).map(escapeHtml).join(' • ')}</span>
        </div>
        <p class="line-clamp">${escapeHtml(compactText(item.description || '', 220))}</p>
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

export const playlistCard = (item) => `
  <article class="playlist-card">
    <div class="playlist-title">${escapeHtml(item.title || '')}</div>
    <div class="playlist-meta">${formatCompactNumber(item.videoCount || 0)} 本</div>
  </article>
`;

export const hashtagCard = (item) => `
  <article class="hashtag-card">
    <a href="/search?q=${encodeURIComponent(item.title || '')}" class="hashtag-title">#${escapeHtml(item.title || '')}</a>
    <div class="playlist-meta">${formatCompactNumber(item.videoCount || 0)} 件の動画</div>
  </article>
`;

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

const pageShell = (body, title, query = '', active = 'home') => ({
  html: shell(body, { query, active }),
  title,
});

export const homePage = (trending, region = 'US') => {
  const chips = ['すべて', '音楽', 'ゲーム', 'ニュース', 'ライブ', '映画', '学習', 'スポーツ']
    .map((label, index) => `<a class="chip${index === 0 ? ' active' : ''}" href="/search?q=${encodeURIComponent(label)}">${escapeHtml(label)}</a>`)
    .join('');

  const videos = (trending || []).slice(0, 24).map((item) => videoCard(item)).join('');
  return pageShell(`
    <section class="page-head">
      <div>
        <p class="eyebrow">ホーム</p>
        <h1>トレンド</h1>
        <p class="page-copy">AuroraTube で今見られている動画を集約表示します。</p>
      </div>
      <div class="page-head-meta">
        <span class="metric">Region ${escapeHtml(region)}</span>
        <span class="metric">Trending</span>
      </div>
    </section>

    <section class="chip-row sticky-chips">${chips}</section>

    <section class="video-grid">${videos || '<div class="empty">結果がありません</div>'}</section>
  `, 'AuroraTube', '', 'home');
};

export const searchPage = (query, filters, items = []) => {
  const videos = items.filter((item) => item.type === 'video' || item.videoId);
  const channels = items.filter((item) => item.type === 'channel');
  const playlists = items.filter((item) => item.type === 'playlist');
  const hashtags = items.filter((item) => item.type === 'hashtag');
  const tabs = [
    ['all', 'すべて'],
    ['video', '動画'],
    ['channel', 'チャンネル'],
    ['playlist', '再生リスト'],
  ];

  return pageShell(`
    <section class="page-head">
      <div>
        <p class="eyebrow">検索</p>
        <h1>${escapeHtml(query)}</h1>
        <p class="page-copy">${formatCompactNumber(items.length)} 件の結果</p>
      </div>
    </section>

    <section class="chip-row sticky-chips">
      ${tabs.map(([value, label]) => `<a class="chip${String(filters.type || 'all') === value ? ' active' : ''}" href="/search?q=${encodeURIComponent(query)}&type=${encodeURIComponent(value)}">${escapeHtml(label)}</a>`).join('')}
      <form id="filter-form" class="filter-strip">
        <input type="hidden" name="q" value="${escapeHtml(query)}" />
        <select name="sort" aria-label="並び替え">
          ${['relevance', 'views', 'date', 'rating'].map((value) => `<option value="${value}" ${String(filters.sort || 'relevance') === value ? 'selected' : ''}>${value}</option>`).join('')}
        </select>
        <select name="date" aria-label="期間">
          ${['', 'hour', 'today', 'week', 'month', 'year'].map((value) => `<option value="${value}" ${String(filters.date || '') === value ? 'selected' : ''}>${value || 'any'}</option>`).join('')}
        </select>
        <select name="duration" aria-label="長さ">
          ${['', 'short', 'medium', 'long'].map((value) => `<option value="${value}" ${String(filters.duration || '') === value ? 'selected' : ''}>${value || 'any'}</option>`).join('')}
        </select>
        <input name="features" value="${escapeHtml(filters.features || '')}" placeholder="features" aria-label="特徴" />
        <button type="submit" class="ghost-btn">適用</button>
      </form>
    </section>

    ${videos.length ? `<section class="results-list">${videos.map((item) => videoRow(item)).join('')}</section>` : '<div class="empty">動画がありません</div>'}
    ${channels.length ? `<section class="section-block"><div class="section-title"><h2>チャンネル</h2></div><div class="card-grid">${channels.map((item) => channelCard(item)).join('')}</div></section>` : ''}
    ${playlists.length ? `<section class="section-block"><div class="section-title"><h2>再生リスト</h2></div><div class="card-grid">${playlists.map((item) => playlistCard(item)).join('')}</div></section>` : ''}
    ${hashtags.length ? `<section class="section-block"><div class="section-title"><h2>ハッシュタグ</h2></div><div class="card-grid">${hashtags.map((item) => hashtagCard(item)).join('')}</div></section>` : ''}
  `, `${query} - AuroraTube`, query, 'search');
};

export const watchPage = (payload = {}) => {
  const v = payload.video || {};
  const related = Array.isArray(payload.related) ? payload.related.slice(0, 16) : [];
  const comments = Array.isArray(payload.comments) ? payload.comments : [];
  const provider = payload.provider || {};
  const commentsProvider = payload.commentsProvider || {};
  const captions = Array.isArray(v.captions) ? v.captions : [];
  const keywords = Array.isArray(v.keywords) ? v.keywords : [];
  const musicTracks = Array.isArray(v.musicTracks) ? v.musicTracks : [];
  const chapters = Array.isArray(v.chapters) ? v.chapters : [];

  return pageShell(`
    <section class="watch-layout">
      <div class="watch-main">
        <div class="player-shell">
          <video class="player" controls playsinline preload="metadata" poster="${escapeHtml(v.thumbnail || '')}" src="/api/watch/${encodeURIComponent(v.videoId || '')}/stream"></video>
        </div>

        <div class="watch-copy">
          <p class="eyebrow">視聴</p>
          <h1 class="watch-title">${escapeHtml(v.title || '')}</h1>

          <div class="watch-meta-row">
            <div class="watch-stats">
              <span>${v.viewCount ? `${formatCompactNumber(v.viewCount)} 回視聴` : '0 回視聴'}</span>
              <span>${v.publishedText ? escapeHtml(v.publishedText) : ''}</span>
              ${provider.label ? `<span>${escapeHtml(provider.label)}</span>` : provider.mode ? `<span>${escapeHtml(`ytDlp(${provider.mode})`)}</span>` : provider.instance ? `<span>${escapeHtml(provider.instance)}</span>` : ''}
              ${commentsProvider.label && commentsProvider.label !== provider.label ? `<span>comments: ${escapeHtml(commentsProvider.label)}</span>` : ''}
            </div>
            <div class="watch-actions">
              <button class="action-btn" type="button" disabled><span class="action-icon">${icon('like')}</span><span>高評価</span></button>
              <button class="action-btn" type="button" disabled><span class="action-icon">${icon('share')}</span><span>共有</span></button>
              <button class="action-btn" type="button" disabled><span class="action-icon">${icon('clip')}</span><span>クリップ</span></button>
              <button class="action-btn" type="button" disabled><span class="action-icon">${icon('save')}</span><span>保存</span></button>
              <button class="icon-btn more-btn" type="button" aria-label="その他" disabled>${icon('more')}</button>
            </div>
          </div>

          <div class="channel-strip">
            <a class="channel-anchor" href="${v.authorId ? `/channel/${encodeURIComponent(v.authorId)}` : '#'}">
              <span class="channel-avatar">${avatar(v.authorThumbnails)}</span>
              <span class="channel-info">
                <span class="channel-name">${escapeHtml(v.author || '')}</span>
                <span class="channel-submeta">${escapeHtml(v.authorId || '')}${v.isFamilyFriendly === false ? ' • 制限付き' : ''}</span>
              </span>
            </a>
            <button class="subscribe-btn" type="button" disabled>登録</button>
          </div>

          <section class="description-card">
            <div class="description-topline">
              <span>${v.lengthSeconds ? formatDuration(v.lengthSeconds) : ''}</span>
              <span>${v.rating ? escapeHtml(String(v.rating)) : ''}</span>
            </div>
            <div class="description">${v.description ? textBlock(v.description) : '<p>説明がありません。</p>'}</div>
          </section>

          ${chapters.length ? `<section class="section-block"><div class="section-title"><h2>チャプター</h2></div><div class="stack">${chapters.map((chapter) => `<div class="info-row"><strong>${escapeHtml(chapter.title || '')}</strong><span>${escapeHtml(chapter.startTime || chapter.start || '')}</span></div>`).join('')}</div></section>` : ''}

          ${keywords.length ? `<section class="section-block"><div class="section-title"><h2>キーワード</h2></div><div class="chip-row">${keywords.slice(0, 20).map((item) => `<span class="chip static">${escapeHtml(item)}</span>`).join('')}</div></section>` : ''}
          ${captions.length ? `<section class="section-block"><div class="section-title"><h2>字幕</h2></div><div class="chip-row">${captions.map((item) => `<span class="chip static">${escapeHtml(item.label || item.languageCode || '')}</span>`).join('')}</div></section>` : ''}
          ${musicTracks.length ? `<section class="section-block"><div class="section-title"><h2>音楽情報</h2></div><div class="stack">${musicTracks.map((track) => `<div class="info-row"><strong>${escapeHtml(track.song || '')}</strong><span>${escapeHtml(track.artist || '')}${track.album ? ` • ${escapeHtml(track.album)}` : ''}</span></div>`).join('')}</div></section>` : ''}

          <section class="comments-section">
            <div class="section-title">
              <h2>コメント</h2>
              <span class="count" data-comment-count>${formatNumber(v.commentsCount || comments.length)} 件</span>
            </div>
            <div class="comment-sortbar">
              <span class="sort-label">並び替え</span>
              <button class="chip active" type="button" disabled>人気順</button>
            </div>
            <div class="comments" data-comments>${comments.map((comment) => commentCard(comment)).join('') || '<div class="empty">コメントがありません</div>'}</div>
            ${payload.commentsContinuation ? `<button class="ghost-btn load-more" type="button" data-load-comments="${escapeHtml(payload.commentsContinuation)}" data-video-id="${escapeHtml(v.videoId || '')}" data-comments-instance="${escapeHtml(commentsProvider.instance || '')}">さらに表示</button>` : ''}
          </section>
        </div>
      </div>

      <aside class="watch-side">
        <section class="related-panel">
          <div class="section-title"><h2>次のおすすめ</h2></div>
          <div class="related-list">${related.map((item) => videoCard(item, 'row')).join('') || '<div class="empty">関連動画がありません</div>'}</div>
        </section>
      </aside>
    </section>
  `, `${v.title || 'Watch'} - AuroraTube`, '', 'watch');
};

export const channelPage = (payload = {}) => {
  const header = payload.header || {};
  const videos = Array.isArray(payload.videos) ? payload.videos : [];
  const playlists = Array.isArray(payload.playlists) ? payload.playlists : [];
  const related = Array.isArray(payload.relatedChannels) ? payload.relatedChannels : [];
  const tabs = [
    ['videos', '動画'],
    ['playlists', '再生リスト'],
    ['channels', 'チャンネル'],
  ];

  return pageShell(`
    <section class="channel-hero">
      <div class="channel-banner" style="${header.banner ? `background-image:url('${escapeHtml(header.banner)}')` : ''}"></div>
      <div class="channel-profile">
        <div class="channel-profile-avatar">${avatar([{ url: header.avatar }])}</div>
        <div class="channel-profile-copy">
          <p class="eyebrow">チャンネル</p>
          <h1>${escapeHtml(header.name || payload.title || payload.channelId || '')}</h1>
          <div class="channel-submeta">${escapeHtml(header.id || payload.channelId || '')}${header.subCountText ? ` • ${escapeHtml(header.subCountText)}` : ''}${header.verified ? ' • Verified' : ''}</div>
          <p class="channel-description">${escapeHtml(header.description || '')}</p>
          <div class="channel-toolbar">
            <div class="chip-row">${tabs.map(([value, label]) => `<a class="chip" href="#${value}">${escapeHtml(label)}</a>`).join('')}</div>
            <button class="subscribe-btn" type="button" disabled>登録</button>
          </div>
        </div>
      </div>
    </section>

    <section id="videos" class="section-block">
      <div class="section-title">
        <h2>動画</h2>
        ${payload.continuation ? `<button class="ghost-btn" type="button" data-load-channel="${escapeHtml(payload.continuation)}" data-channel-id="${escapeHtml(payload.channelId || '')}" data-sort-by="${escapeHtml(payload.sortBy || 'newest')}">さらに表示</button>` : ''}
      </div>
      <section class="video-grid" data-channel-grid>${videos.map((item) => videoCard(item)).join('') || '<div class="empty">動画がありません</div>'}</section>
    </section>

    ${playlists.length ? `<section id="playlists" class="section-block"><div class="section-title"><h2>再生リスト</h2></div><div class="card-grid">${playlists.map((item) => playlistCard(item)).join('')}</div></section>` : ''}
    ${related.length ? `<section id="channels" class="section-block"><div class="section-title"><h2>関連チャンネル</h2></div><div class="card-grid">${related.map((item) => channelCard(item)).join('')}</div></section>` : ''}
  `, `${header.name || payload.title || payload.channelId || 'Channel'} - AuroraTube`, '', 'channel');
};

export const notFoundPage = () => pageShell('<div class="empty large">ページが見つかりません。</div>', '404 - AuroraTube', '', 'home');
