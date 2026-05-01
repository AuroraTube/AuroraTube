let overlay = null;

const ensureOverlay = () => {
  if (overlay) return overlay;
  overlay = document.getElementById('route-loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'route-loading-overlay';
    overlay.className = 'route-loading';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.hidden = true;
    overlay.innerHTML = '<div class="route-loading-card" aria-hidden="true"><span class="route-loading-spinner"></span><span class="route-loading-text">読み込み中…</span></div>';
    document.body.appendChild(overlay);
  }
  return overlay;
};

export const setLoadingState = (isLoading, label = '読み込み中…') => {
  const el = ensureOverlay();
  const text = el.querySelector('.route-loading-text');
  if (text) text.textContent = label;
  el.hidden = !isLoading;
  document.body.classList.toggle('is-loading', Boolean(isLoading));
};
