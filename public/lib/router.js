export const navigate = (url, { replace = false } = {}) => {
  if (replace) {
    history.replaceState({}, '', url);
  } else {
    history.pushState({}, '', url);
  }
  window.dispatchEvent(new Event('app:navigate'));
};

export const currentUrl = () => new URL(location.href);

export const onInternalLink = (event) => {
  const link = event.target.closest?.('a[href]');
  if (!link) return false;
  if (link.getAttribute('href')?.startsWith('/api/')) return false;
  if (link.target && link.target !== '_self') return false;
  if (link.hasAttribute('download')) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  const href = link.getAttribute('href') || '';
  if (!href.startsWith('/')) return false;
  event.preventDefault();
  navigate(href);
  return true;
};
