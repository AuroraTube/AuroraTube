import { api } from './lib/api.js';
import { navigate, onInternalLink, currentUrl } from './lib/router.js';
import { escapeHtml } from './lib/format.js';
import { commentCard, videoCard } from './lib/cards.js';
import { homePage, searchPage, shortsPage, trendingPage, watchPage, channelPage, notFoundPage } from './pages.js';
import { setLoadingState } from './lib/ui.js';
import { bindPlayers } from './lib/player.js';

const app = document.getElementById('app');

const state = {
  searchAbort: null,
  searchTimer: 0,
  renderToken: 0,
  renderAbort: null,
  activeRenders: 0,
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

const bindSearchForm = () => {
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

const setButtonState = (button, label, disabled = false) => {
  button.disabled = disabled;
  button.textContent = label;
};

const appendComments = async (button, signal) => {
  const videoId = button.getAttribute('data-video-id') || '';
  const continuation = button.getAttribute('data-load-comments') || '';
  if (!videoId || !continuation) return;

  setButtonState(button, '読み込み中…', true);

  try {
    const payload = await api.watchComments(videoId, continuation, signal);
    const container = document.querySelector('[data-comments]');
    if (container && Array.isArray(payload.comments)) {
      container.insertAdjacentHTML('beforeend', payload.comments.map((comment) => commentCard(comment)).join(''));
    }
    button.remove();
  } catch (error) {
    setButtonState(button, error?.message || '失敗しました', false);
  }
};

const appendChannelVideos = async (button, signal) => {
  const channelId = button.getAttribute('data-channel-id') || '';
  const continuation = button.getAttribute('data-load-channel') || '';
  const sortBy = button.getAttribute('data-sort-by') || 'newest';
  if (!channelId || !continuation) return;

  setButtonState(button, '読み込み中…', true);

  try {
    const payload = await api.channel(channelId, { continuation, sortBy }, signal);
    const grid = document.querySelector('[data-channel-grid]');
    if (grid && Array.isArray(payload.videos)) {
      grid.insertAdjacentHTML('beforeend', payload.videos.map((item) => videoCard(item)).join(''));
    }
    button.remove();
  } catch (error) {
    setButtonState(button, error?.message || '失敗しました', false);
  }
};

const bindDynamicButtons = () => {
  document.addEventListener('click', async (event) => {
    if (onInternalLink(event)) return;

    const commentButton = event.target.closest?.('[data-load-comments]');
    if (commentButton) {
      await appendComments(commentButton, state.renderAbort?.signal);
      return;
    }

    const channelButton = event.target.closest?.('[data-load-channel]');
    if (channelButton) {
      await appendChannelVideos(channelButton, state.renderAbort?.signal);
    }
  });
};

const beginRender = () => {
  state.activeRenders += 1;
  setLoadingState(true);
};

const endRender = () => {
  state.activeRenders = Math.max(0, state.activeRenders - 1);
  if (state.activeRenders === 0) {
    setLoadingState(false);
  }
};

const render = async () => {
  const token = ++state.renderToken;
  state.renderAbort?.abort?.();
  state.renderAbort = new AbortController();
  const { signal } = state.renderAbort;

  beginRender();

  const url = currentUrl();
  const path = url.pathname;
  const query = readSearchParams();

  try {
    let page;
    if (path === '/' || path === '') {
      const trending = await api.trending('default', defaultRegion, signal);
      page = homePage(trending.items || [], defaultRegion);
    } else if (path === '/trending') {
      const trending = await api.trending('default', defaultRegion, signal);
      page = trendingPage(trending.items || [], defaultRegion);
    } else if (path === '/search') {
      const q = String(query.get('q') || '').trim();
      if (!q) {
        const trending = await api.trending('default', defaultRegion, signal);
        page = trendingPage(trending.items || [], defaultRegion);
      } else {
        const filters = {
          type: query.get('type') || 'all',
          sort: query.get('sort') || 'relevance',
          date: query.get('date') || '',
          duration: query.get('duration') || '',
          features: query.get('features') || '',
        };
        const payload = await api.search(q, filters, signal);
        page = searchPage(payload.query || q, payload.filters || filters, payload.items || []);
      }
    } else if (path.startsWith('/watch/')) {
      const id = decodeURIComponent(path.replace('/watch/', ''));
      page = watchPage(await api.watch(id, signal));
    } else if (path.startsWith('/shorts/')) {
      const id = decodeURIComponent(path.replace('/shorts/', ''));
      const payload = await api.watch(id, signal);
      if (!(Number(payload?.video?.lengthSeconds || 0) > 0 && Number(payload.video.lengthSeconds) <= 60)) {
        navigate(`/watch/${encodeURIComponent(id)}`, { replace: true });
        return;
      }
      page = shortsPage(payload);
    } else if (path.startsWith('/channel/')) {
      const id = decodeURIComponent(path.replace('/channel/', ''));
      const sortBy = String(query.get('sortBy') || 'newest');
      page = channelPage({ ...(await api.channel(id, { sortBy }, signal)), sortBy });
    } else {
      page = notFoundPage();
    }

    if (signal.aborted || token !== state.renderToken) return;
    app.innerHTML = page.html;
    document.title = page.title || 'AuroraTube';
    window.scrollTo(0, 0);
  } catch (error) {
    if (signal.aborted || token !== state.renderToken) return;
    app.innerHTML = `
      <div class="empty large error-state">
        <strong>${escapeHtml(error?.message || '読み込みに失敗しました')}</strong>
        <span>${escapeHtml(String(error?.details || ''))}</span>
      </div>
    `;
    document.title = 'AuroraTube';
  } finally {
    if (token === state.renderToken) {
      bindSearchForm();
      bindPlayers();
    }
    endRender();
  }
};

window.addEventListener('popstate', render);
window.addEventListener('app:navigate', render);
bindDynamicButtons();
render();
