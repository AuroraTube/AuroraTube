import { api } from './lib/api.js';
import { navigate, onInternalLink, currentUrl } from './lib/router.js';
import { escapeHtml } from './lib/format.js';
import { commentCard, videoCard } from './lib/cards.js';
import { homePage, searchPage, shortsFeedPage, shortsPage, watchPage, channelPage, notFoundPage } from './pages.js';
import { setLoadingState } from './lib/ui.js';
import { bindPlayers } from './lib/player.js';
import { buildResultsUrl, parseAppRoute } from './lib/routes.js';

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

const bindSearchForm = () => {
  const form = document.getElementById('search-form');
  if (!form) return;

  const input = form.querySelector('input[name="q"]');
  const box = document.getElementById('search-suggestions');
  if (!input || !box) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    navigate(buildResultsUrl(input.value.trim()));
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
    navigate(buildResultsUrl(value));
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
  const route = parseAppRoute(currentUrl());

  beginRender();

  try {
    let page;

    if (route.route === 'home') {
      const trending = await api.trending('default', defaultRegion, signal);
      page = homePage(trending.items || [], defaultRegion);
    } else if (route.route === 'results') {
      if (!route.query) {
        const trending = await api.trending('default', defaultRegion, signal);
        page = homePage(trending.items || [], defaultRegion);
      } else {
        const payload = await api.search(route.query, route.filters, signal);
        page = searchPage(payload.query || route.query, payload.filters || route.filters, payload.items || []);
      }
    } else if (route.route === 'watch') {
      if (!route.videoId) {
        page = notFoundPage();
      } else {
        page = watchPage(await api.watch(route.videoId, { quality: route.quality }, signal));
      }
    } else if (route.route === 'shorts-feed') {
      const trending = await api.trending('default', defaultRegion, signal);
      page = shortsFeedPage(trending.items || [], defaultRegion);
    } else if (route.route === 'shorts') {
      if (!route.videoId) {
        page = notFoundPage();
      } else {
        const payload = await api.watch(route.videoId, {}, signal);
        if (!(Number(payload?.video?.lengthSeconds || 0) > 0 && Number(payload.video.lengthSeconds) <= 60)) {
          navigate(`/watch?v=${encodeURIComponent(route.videoId)}`, { replace: true });
          return;
        }
        page = shortsPage(payload);
      }
    } else if (route.route === 'channel') {
      if (!route.channelId) {
        page = notFoundPage();
      } else {
        const sortBy = String(route.sortBy || 'newest');
        page = channelPage({ ...(await api.channel(route.channelId, { sortBy }, signal)), sortBy });
      }
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
