import { api } from './lib/api.js';
import { navigate, onInternalLink, currentUrl } from './lib/router.js';
import { escapeHtml } from './lib/format.js';
import { homePage, searchPage, watchPage, channelPage, notFoundPage, commentCard, videoCard } from './pages.js';

const app = document.getElementById('app');

const state = {
  searchAbort: null,
  searchTimer: 0,
};

const locale = navigator.language || 'ja-JP';
const defaultRegion = locale.toLowerCase().startsWith('ja') ? 'JP' : 'US';

const readSearchParams = () => currentUrl().searchParams;

const buildSearchUrl = (params = {}) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `/search?${query}` : '/search';
};

const bindSearchForms = () => {
  const form = document.getElementById('search-form');
  if (!form) return;

  const input = form.querySelector('input[name="q"]');
  const box = document.getElementById('search-suggestions');
  if (!input || !box) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    navigate(buildSearchUrl({ q: input.value.trim() }));
  });

  input.addEventListener('input', () => {
    clearTimeout(state.searchTimer);
    state.searchTimer = window.setTimeout(async () => {
      const value = input.value.trim();
      if (value.length < 2) {
        box.hidden = true;
        box.innerHTML = '';
        return;
      }

      state.searchAbort?.abort?.();
      state.searchAbort = new AbortController();

      try {
        const payload = await api.suggestions(value, state.searchAbort.signal);
        const suggestions = Array.isArray(payload.suggestions) ? payload.suggestions : [];
        if (!suggestions.length) {
          box.hidden = true;
          box.innerHTML = '';
          return;
        }
        box.innerHTML = suggestions.slice(0, 8).map((item) => `<button type="button" class="suggestion-item" data-suggestion="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join('');
        box.hidden = false;
      } catch {
        box.hidden = true;
      }
    }, 180);
  });

  box.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-suggestion]');
    if (!button) return;
    const value = button.getAttribute('data-suggestion') || '';
    navigate(buildSearchUrl({ q: value }));
  });
};

const bindFilterForms = () => {
  const filterForm = document.getElementById('filter-form');
  if (!filterForm) return;

  filterForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(filterForm);
    navigate(buildSearchUrl({
      q: data.get('q') || '',
      type: data.get('type') || '',
      sort: data.get('sort') || '',
      date: data.get('date') || '',
      duration: data.get('duration') || '',
      features: data.get('features') || '',
    }));
  });
};

const setCommentButtonState = (button, label, disabled = false) => {
  button.disabled = disabled;
  button.textContent = label;
};

const appendComments = async (button) => {
  const videoId = button.getAttribute('data-video-id') || '';
  const continuation = button.getAttribute('data-load-comments') || '';
  const instance = button.getAttribute('data-comments-instance') || '';
  if (!videoId || !continuation) return;

  setCommentButtonState(button, '読み込み中…', true);

  try {
    const payload = await api.watchComments(videoId, continuation, instance);
    const container = document.querySelector('[data-comments]');
    const count = document.querySelector('[data-comment-count]');
    if (container && Array.isArray(payload.comments)) {
      container.insertAdjacentHTML('beforeend', payload.comments.map((comment) => commentCard(comment)).join(''));
    }
    if (count) count.textContent = `${new Intl.NumberFormat(locale).format(Number(payload.commentCount || 0))} 件`;
    button.remove();
  } catch (error) {
    setCommentButtonState(button, error?.message || '失敗しました', false);
  }
};

const appendChannelVideos = async (button) => {
  const channelId = button.getAttribute('data-channel-id') || '';
  const continuation = button.getAttribute('data-load-channel') || '';
  const sortBy = button.getAttribute('data-sort-by') || 'newest';
  if (!channelId || !continuation) return;

  setCommentButtonState(button, '読み込み中…', true);

  try {
    const payload = await api.channel(channelId, { continuation, sortBy });
    const grid = document.querySelector('[data-channel-grid]');
    if (grid && Array.isArray(payload.videos)) {
      grid.insertAdjacentHTML('beforeend', payload.videos.map((item) => videoCard(item)).join(''));
    }
    button.remove();
  } catch (error) {
    setCommentButtonState(button, error?.message || '失敗しました', false);
  }
};

const bindDynamicButtons = () => {
  document.addEventListener('click', async (event) => {
    if (onInternalLink(event)) return;

    const commentButton = event.target.closest?.('[data-load-comments]');
    if (commentButton) {
      await appendComments(commentButton);
      return;
    }

    const channelButton = event.target.closest?.('[data-load-channel]');
    if (channelButton) {
      await appendChannelVideos(channelButton);
    }
  });
};

const render = async () => {
  const url = currentUrl();
  const path = url.pathname;
  const query = readSearchParams();
  const q = String(query.get('q') || '').trim();
  const videoId = String(query.get('v') || '').trim();

  try {
    let page;
    if (path === '/' || path === '') {
      const trending = await api.trending('default', defaultRegion);
      page = homePage(trending.items || [], defaultRegion);
    } else if (path === '/watch' && videoId) {
      page = watchPage(await api.watch(videoId));
    } else if (path === '/search') {
      if (!q) {
        const trending = await api.trending('default', defaultRegion);
        page = homePage(trending.items || [], defaultRegion);
      } else {
        const filters = {
          type: query.get('type') || 'all',
          sort: query.get('sort') || 'relevance',
          date: query.get('date') || '',
          duration: query.get('duration') || '',
          features: query.get('features') || '',
        };
        const payload = await api.search(q, filters);
        page = searchPage(payload.query || q, payload.filters || filters, payload.items || []);
      }
    } else if (path.startsWith('/channel/')) {
      const id = decodeURIComponent(path.replace('/channel/', ''));
      const sortBy = String(query.get('sortBy') || 'newest');
      page = channelPage({ ...(await api.channel(id, { sortBy })), sortBy });
    } else {
      page = notFoundPage();
    }

    app.innerHTML = page.html;
    document.title = page.title || 'AuroraTube';
  } catch (error) {
    app.innerHTML = `
      <div class="empty large error-state">
        <strong>${escapeHtml(error?.message || '読み込みに失敗しました')}</strong>
        <span>${escapeHtml(String(error?.details || ''))}</span>
      </div>
    `;
    document.title = 'AuroraTube';
  }

  bindSearchForms();
  bindFilterForms();
};

window.addEventListener('popstate', render);
window.addEventListener('app:navigate', render);
bindDynamicButtons();
render();
