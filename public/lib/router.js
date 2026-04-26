export const navigate = (url) => {
  history.pushState({}, '', url);
  window.dispatchEvent(new Event('app:navigate'));
};

export const currentUrl = () => new URL(location.href);

export const onInternalLink = (event) => {
  const link = event.target.closest?.('a[href^="/"]');
  if (!link) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  event.preventDefault();
  navigate(link.getAttribute('href'));
  return true;
};
