import { api } from './lib/api.js';
import { navigate, onInternalLink, currentUrl } from './lib/router.js';
import { escapeHtml } from './lib/format.js';
import { commentCard, videoCard } from './lib/cards.js';
import { homePage, searchPage, shortsPage, trendingPage, watchPage, channelPage, notFoundPage } from './pages.js';
import { setLoadingState } from './lib/ui.js';
import { bindPlayers } from './lib/player.js';
import { buildSearchUrl, parseClientRoute } from './lib/routes.js';

const app = document.getElementById('app');

const state = {
  searchAbort: null,
  searchTimer: 0,
  renderToken: 0,
  renderAbort: null,
};

const locale = navigator.language || 'ja-JP';
const defaultRegion = locale.toLowerCase().startsWith('ja') ? 'JP' : 'US';

const bindSearchForm = () => {
  const form = document.getElementById('search-form');
  if (!form) return;

  const input = form.querySelector('input[name="q"]');
  const box = document.getElementById('search-suggestions');
  if (!input || !box) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = input.value.trim();
    navigate(query ? buildSearchUrl(query) : '/feed/trending');
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
    navigate(buildSearchUrl(value));
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

const render = async () => {
  const renderToken = ++state.renderToken;
  state.renderAbort?.abort?.();
  state.renderAbort = new AbortController();
  const { signal } = state.renderAbort;

  setLoadingState(true);

  const url = currentUrl();
  const route = parseClientRoute(url);

  try {
    let page;
    switch (route.route) {
      case 'home': {
        const trending = await api.trending('default', defaultRegion, signal);
        page = homePage(trending.items || [], defaultRegion);
        break;
      }
      case 'trending': {
        const trending = await api.trending('default', defaultRegion, signal);
        page = trendingPage(trending.items || [], defaultRegion);
        break;
      }
      case 'search': {
        if (!route.query) {
          const trending = await api.trending('default', defaultRegion, signal);
          page = trendingPage(trending.items || [], defaultRegion);
        } else {
          const filters = {
            type: route.filters?.type || 'all',
            sort: route.filters?.sort || 'relevance',
            date: route.filters?.date || '',
            duration: route.filters?.duration || '',
            features: route.filters?.features || '',
          };
          const payload = await api.search(route.query, filters, signal);
          page = searchPage(payload.query || route.query, payload.filters || filters, payload.items || []);
        }
        break;
      }
      case 'watch': {
        const id = String(route.id || '').trim();
        if (!id) {
          page = notFoundPage();
          break;
        }
        page = watchPage(await api.watch(id, signal));
        break;
      }
      case 'shorts': {
        const id = String(route.id || '').trim();
        if (!id) {
          page = notFoundPage();
          break;
        }
        const payload = await api.watch(id, signal);
        if (!(Number(payload?.video?.lengthSeconds || 0) > 0 && Number(payload.video.lengthSeconds) <= 60)) {
          navigate(`/watch?v=${encodeURIComponent(id)}`, { replace: true });
          return;
        }
        page = shortsPage(payload);
        break;
      }
      case 'channel': {
        const id = String(route.id || '').trim();
        if (!id) {
          page = notFoundPage();
          break;
        }
        const sortBy = String(url.searchParams.get('sortBy') || 'newest');
        page = channelPage({ ...(await api.channel(id, { sortBy }, signal)), sortBy });
        break;
      }
      default:
        page = notFoundPage();
        break;
    }

    if (signal.aborted || renderToken !== state.renderToken) return;
    const canonicalUrl = route.canonicalUrl || `${url.pathname}${url.search}`;
    const currentUrlText = `${url.pathname}${url.search}`;
    if (canonicalUrl && canonicalUrl !== currentUrlText) {
      history.replaceState({}, '', canonicalUrl);
    }
    app.innerHTML = page.html;
    document.title = page.title || 'AuroraTube';
    window.scrollTo(0, 0);
  } catch (error) {
    if (signal.aborted || renderToken !== state.renderToken) return;
    app.innerHTML = `
      <div class="empty large error-state">
        <strong>${escapeHtml(error?.message || '読み込みに失敗しました')}</strong>
        <span>${escapeHtml(String(error?.details || ''))}</span>
      </div>
    `;
    document.title = 'AuroraTube';
  } finally {
    if (renderToken === state.renderToken) {
      setLoadingState(false);
      bindSearchForm();
      bindPlayers();
    }
  }
};

window.addEventListener('popstate', render);
window.addEventListener('app:navigate', render);
bindDynamicButtons();
render();
