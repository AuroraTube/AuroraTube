/**
 * YouTube timedtext often defaults to json3/srv3.
 * Browsers need WebVTT for HTML track elements — force fmt=vtt when applicable.
 */
export function preferWebVttUrl(url: string): string {
  try {
    const u = new URL(url)
    if (
      u.hostname.endsWith('youtube.com') ||
      u.pathname.includes('timedtext') ||
      u.searchParams.has('fmt')
    ) {
      u.searchParams.set('fmt', 'vtt')
      return u.toString()
    }
  } catch {
    /* keep original */
  }
  return url
}
