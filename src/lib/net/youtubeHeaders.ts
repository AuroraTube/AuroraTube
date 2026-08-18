import { BROWSER_UA } from './userAgent'

/** Browser-like headers when fetching YouTube-related media endpoints. */
export function youtubeMediaHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    'User-Agent': BROWSER_UA,
    Accept: '*/*',
    Referer: 'https://www.youtube.com/',
    Origin: 'https://www.youtube.com',
    ...extra,
  }
}
