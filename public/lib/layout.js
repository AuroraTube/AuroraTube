import { escapeHtml } from './format.js';

const navItem = (href, label, active, icon) => `
  <a class="rail-link${active ? ' active' : ''}" href="${href}">
    <span class="rail-icon" aria-hidden="true">${icon}</span>
    <span class="rail-label">${escapeHtml(label)}</span>
  </a>
`;

export const youtubeShell = ({ body, title, query = '', active = 'home' } = {}) => ({
  html: `
    <header class="topbar topbar--youtube">
      <div class="topbar-left">
        <button class="topbar-menu" type="button" data-sidebar-toggle aria-label="サイドバーを切り替え" aria-pressed="false">☰</button>
        <a class="brand brand--youtube" href="/" aria-label="AuroraTube ホーム">
          <span class="brand-badge" aria-hidden="true"><span class="brand-badge-play"></span></span>
          <span class="brand-name">AuroraTube</span>
        </a>
      </div>

      <form id="search-form" class="search-form search-form--youtube" autocomplete="off">
        <div class="search-field">
          <input id="search-input" name="q" type="search" value="${escapeHtml(query)}" placeholder="検索" aria-label="検索" />
          <div class="search-suggestions" id="search-suggestions" hidden></div>
        </div>
        <button type="submit" class="search-submit" aria-label="検索">検索</button>
      </form>
    </header>

    <div class="app-shell">
      <aside class="side-rail" aria-label="主要ナビゲーション">
        ${navItem('/', 'ホーム', active === 'home', '⌂')}
        ${navItem('/shorts', 'ショート', active === 'shorts', '◫')}
      </aside>
      <main class="content content--youtube">${body}</main>
    </div>
  `,
  title,
});
