const SPA_PREFIXES = ['/feed/trending', '/results', '/watch', '/shorts', '/channel'];

export const isSpaRoute = (pathname = '/') => {
  const path = String(pathname || '/');
  if (path === '/' || path === '') return true;
  if (path.startsWith('/@')) return true;
  return SPA_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
};
