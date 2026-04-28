import { escapeHtml, formatCompactNumber, formatDuration, formatNumber, textBlock } from './lib/format.js';
import { avatar, channelCard, commentCard, isShortVideo, videoCard } from './lib/cards.js';
import { thumbnailUrl } from './lib/images.js';
import { playerMarkup } from './lib/player.js';
import { youtubeShell as pageShell } from './lib/layout.js';

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

const splitSearchItems = (items = []) => {
  const buckets = {
    shorts: [],
    videos: [],
    channels: [],
    playlists: [],
    hashtags: [],
  };

  for (const item of items) {
    const type = String(item?.type || 'video');
    if (type === 'channel') {
      buckets.channels.push(item);
    } else if (type === 'playlist') {
      buckets.playlists.push(item);
    } else if (type === 'hashtag') {
      buckets.hashtags.push(item);
    } else if (isShortVideo(item)) {
      buckets.shorts.push(item);
    } else {
      buckets.videos.push(item);
    }
  }

  return buckets;
};

const navChips = (items = []) => {
  const chips = items.filter(Boolean).map(({ href, label }) => `<a class="chip" href="${href}">${escapeHtml(label)}</a>`).join('');
  return chips ? `<nav class="section-chips" aria-label="ページ内移動">${chips}</nav>` : '';
};

const sectionBlock = (title, items, { id = '', variant = 'grid', empty = '' } = {}) => {
  if (!items.length) return empty ? `<section class="section-block"${id ? ` id="${id}"` : ''}><div class="empty">${escapeHtml(empty)}</div></section>` : '';
  const cardVariant = variant === 'row' ? 'row' : variant === 'short' ? 'short' : 'grid';
  return `
    <section class="section-block"${id ? ` id="${id}"` : ''}>
      <div class="section-head"><h2>${escapeHtml(title)}</h2></div>
      <div class="${variant === 'row' ? 'results-list' : variant === 'short' ? 'short-grid' : 'video-grid'}">${items.map((item) => videoCard(item, cardVariant)).join('')}</div>
    </section>
  `;
};

const entityCard = (item) => {
  const href = item?.type === 'playlist'
    ? (item.playlistId ? `/search?q=${encodeURIComponent(item.title || item.playlistId)}&type=playlist` : '#')
    : item?.type === 'hashtag'
      ? (item.url || '#')
      : '#';

  const title = item?.type === 'playlist' ? item.title : `#${item?.title || ''}`;
  const meta = item?.type === 'playlist'
    ? `${formatNumber(item.videoCount || 0)} 本の動画`
    : `${formatNumber(item.videoCount || 0)} 件の動画`;

  return `
    <article class="entity-card">
      <a href="${escapeHtml(href)}" class="entity-card-link">
        <span class="entity-card-title">${escapeHtml(title || '')}</span>
        <span class="entity-card-meta">${escapeHtml(meta)}</span>
      </a>
    </article>
  `;
};

const playbackNotice = (playback = {}) => {
  const sourceUrl = String(playback.finalUrl || playback.sourceUrl || '');
  if (!sourceUrl) return '';
  const proxy = Boolean(playback.proxy);
  return `
    <section class="playback-note ${proxy ? 'is-proxied' : 'is-direct'}">
      <div class="playback-note-copy">
        <strong>final url · proxy: ${proxy ? 'true' : 'false'}</strong>
        <p>${escapeHtml(proxy ? '再生はローカルプロキシ経由です。' : playback.warning || '再生は Google CDN を直接参照します。')}</p>
      </div>
      <code title="${escapeHtml(sourceUrl)}">${escapeHtml(sourceUrl)}</code>
    </section>
  `;
};

const resultsSummary = (items, filters) => `
  <div class="page-head-meta">
    <span class="pill">${escapeHtml(String(filters.type || 'all'))}</span>
    <span class="pill">${escapeHtml(String(filters.sort || 'relevance'))}</span>
    <span class="pill">${formatCompactNumber(items.length)} 件</span>
  </div>
`;

const channelMeta = (header = {}, payload = {}) => {
  const chips = [];
  if (header.subCountText) chips.push(header.subCountText);
  if (header.videoCount) chips.push(`${formatNumber(header.videoCount)} 本の動画`);
  if (header.verified) chips.push('Verified');
  if (payload.sortBy) chips.push(`sort: ${payload.sortBy}`);
  return chips.filter(Boolean).map(escapeHtml).join(' • ');
};

export const homePage = (items, region = 'US') => {
  const { shorts, videos } = splitVideos(items || []);
  return pageShell(`
    <section class="page-head page-head--youtube">
      <div>
        <p class="eyebrow">ホーム</p>
        <h1>おすすめ</h1>
      </div>
      <div class="page-head-meta">
        <span class="pill">${escapeHtml(region)}</span>
      </div>
    </section>
    ${navChips([
      shorts.length ? { href: '#home-shorts', label: `ショート ${shorts.length}` } : null,
      videos.length ? { href: '#home-videos', label: `動画 ${videos.length}` } : null,
    ])}
    ${sectionBlock('ショート動画', shorts, { id: 'home-shorts', variant: 'short', empty: 'ショート動画がありません' })}
    ${sectionBlock('おすすめの動画', videos, { id: 'home-videos', variant: 'grid', empty: '表示できるコンテンツがありません' })}
  `, 'AuroraTube', '', 'home');
};

export const shortsFeedPage = (items, region = 'US') => {
  const shorts = (items || []).filter((item) => isShortVideo(item));
  return pageShell(`
    <section class="page-head page-head--youtube">
      <div>
        <p class="eyebrow">ショート</p>
        <h1>Shorts</h1>
      </div>
      <div class="page-head-meta">
        <span class="pill">${escapeHtml(region)}</span>
        <span class="pill">${formatCompactNumber(shorts.length)} 本</span>
      </div>
    </section>
    ${navChips([
      shorts.length ? { href: '#shorts-feed', label: `ショート ${shorts.length}` } : null,
    ])}
    ${sectionBlock('ショート動画', shorts, { id: 'shorts-feed', variant: 'short', empty: 'ショート動画がありません' })}
  `, 'Shorts - AuroraTube', '', 'shorts');
};

export const trendingPage = (items, region = 'US') => {
  const { shorts, videos } = splitVideos(items || []);
  return pageShell(`
    <section class="page-head page-head--youtube">
      <div>
        <p class="eyebrow">人気</p>
        <h1>トレンド</h1>
      </div>
      <div class="page-head-meta">
        <span class="pill">${escapeHtml(region)}</span>
      </div>
    </section>
    ${navChips([
      shorts.length ? { href: '#trending-shorts', label: `ショート ${shorts.length}` } : null,
      videos.length ? { href: '#trending-videos', label: `動画 ${videos.length}` } : null,
    ])}
    ${sectionBlock('ショート動画', shorts, { id: 'trending-shorts', variant: 'short', empty: 'ショート動画がありません' })}
    ${sectionBlock('人気の動画', videos, { id: 'trending-videos', variant: 'grid', empty: '結果がありません' })}
  `, 'トレンド - AuroraTube', '', 'home');
};

export const searchPage = (query, filters, items = []) => {
  const buckets = splitSearchItems(items);
  const total = items.length;

  return pageShell(`
    <section class="page-head page-head--youtube">
      <div>
        <p class="eyebrow">検索</p>
        <h1>${escapeHtml(query)}</h1>
      </div>
      ${resultsSummary(items, filters)}
    </section>
    ${navChips([
      buckets.videos.length ? { href: '#search-videos', label: `動画 ${buckets.videos.length}` } : null,
      buckets.shorts.length ? { href: '#search-shorts', label: `ショート ${buckets.shorts.length}` } : null,
      buckets.channels.length ? { href: '#search-channels', label: `チャンネル ${buckets.channels.length}` } : null,
      buckets.playlists.length ? { href: '#search-playlists', label: `再生リスト ${buckets.playlists.length}` } : null,
      buckets.hashtags.length ? { href: '#search-hashtags', label: `ハッシュタグ ${buckets.hashtags.length}` } : null,
    ])}
    ${sectionBlock('動画', buckets.videos, { id: 'search-videos', variant: 'row', empty: total ? '' : '結果がありません' })}
    ${sectionBlock('ショート動画', buckets.shorts, { id: 'search-shorts', variant: 'short', empty: '' })}
    ${buckets.channels.length ? `<section class="section-block" id="search-channels"><div class="section-head"><h2>チャンネル</h2></div><div class="card-grid">${buckets.channels.map((item) => channelCard(item)).join('')}</div></section>` : ''}
    ${buckets.playlists.length ? `<section class="section-block" id="search-playlists"><div class="section-head"><h2>再生リスト</h2></div><div class="card-grid">${buckets.playlists.map((item) => entityCard(item)).join('')}</div></section>` : ''}
    ${buckets.hashtags.length ? `<section class="section-block" id="search-hashtags"><div class="section-head"><h2>ハッシュタグ</h2></div><div class="card-grid">${buckets.hashtags.map((item) => entityCard(item)).join('')}</div></section>` : ''}
    ${!total ? '<div class="empty">結果がありません</div>' : ''}
  `, `${query} - AuroraTube`, query, 'home');
};

export const watchPage = (payload = {}) => {
  const v = payload.video || {};
  const related = Array.isArray(payload.related) ? payload.related.slice(0, 16) : [];
  const comments = Array.isArray(payload.comments) ? payload.comments : [];
  const videoId = String(v.videoId || '');
  const poster = thumbnailUrl(v.thumbnail || '');
  const playback = v.playback || {};

  return pageShell(`
    <article class="watch-layout viewer viewer--youtube">
      <section class="watch-main">
        ${playerMarkup({ videoId, poster, short: false, playback })}

        <section class="watch-title-block">
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
      </section>

      <aside class="watch-sidebar">
        <div class="section-head">
          <h2>関連動画</h2>
        </div>
        <div class="related-stack">${related.map((item) => videoCard(item, 'row')).join('') || '<div class="empty">関連動画がありません</div>'}</div>
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
    <article class="shorts-layout viewer viewer-short viewer--youtube">
      <section class="shorts-main">
        ${playerMarkup({ videoId, poster, short: true, playback })}

        <section class="watch-title-block">
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
      </section>

      <aside class="watch-sidebar">
        <div class="section-head"><h2>関連動画</h2></div>
        <div class="related-stack">${related.map((item) => videoCard(item, 'short')).join('') || '<div class="empty">関連動画がありません</div>'}</div>
      </aside>
    </article>
  `, `${v.title || 'Shorts'} - AuroraTube`, '', 'shorts');
};

export const channelPage = (payload = {}) => {
  const header = payload.header || {};
  const items = Array.isArray(payload.videos) ? payload.videos : [];
  const { shorts, videos } = splitVideos(items);
  const playlists = Array.isArray(payload.playlists) ? payload.playlists : [];
  const relatedChannels = Array.isArray(payload.relatedChannels) ? payload.relatedChannels : [];

  return pageShell(`
    <section class="channel-page">
      <div class="channel-hero">
        ${header.banner ? `<div class="channel-banner"><img src="${escapeHtml(thumbnailUrl(header.banner))}" alt="" loading="lazy" referrerpolicy="no-referrer" /></div>` : ''}
        <div class="channel-profile">
          <div class="channel-profile-avatar">${avatar(header.avatar ? [{ url: header.avatar }] : [])}</div>
          <div class="channel-profile-copy">
            <p class="eyebrow">チャンネル</p>
            <h1>${escapeHtml(header.name || payload.title || payload.channelId || '')}</h1>
            <div class="channel-submeta">${channelMeta(header, payload)}</div>
            ${header.description ? `<p class="channel-description">${escapeHtml(header.description)}</p>` : ''}
          </div>
        </div>
      </div>

      ${navChips([
        videos.length ? { href: '#channel-videos', label: `動画 ${videos.length}` } : null,
        shorts.length ? { href: '#channel-shorts', label: `ショート ${shorts.length}` } : null,
        playlists.length ? { href: '#channel-playlists', label: `再生リスト ${playlists.length}` } : null,
        relatedChannels.length ? { href: '#channel-related', label: `関連チャンネル ${relatedChannels.length}` } : null,
      ])}

      ${sectionBlock('動画', videos, { id: 'channel-videos', variant: 'grid', empty: '動画がありません' })}
      ${sectionBlock('ショート動画', shorts, { id: 'channel-shorts', variant: 'short', empty: '' })}
      ${playlists.length ? `<section class="section-block" id="channel-playlists"><div class="section-head"><h2>再生リスト</h2></div><div class="card-grid">${playlists.map((item) => entityCard(item)).join('')}</div></section>` : ''}
      ${relatedChannels.length ? `<section class="section-block" id="channel-related"><div class="section-head"><h2>関連チャンネル</h2></div><div class="card-grid">${relatedChannels.map((item) => channelCard(item)).join('')}</div></section>` : ''}
    </section>
  `, `${header.name || payload.title || payload.channelId || 'Channel'} - AuroraTube`, '', 'home');
};

export const notFoundPage = () => pageShell('<div class="empty large">ページが見つかりません。</div>', '404 - AuroraTube', '', 'home');
