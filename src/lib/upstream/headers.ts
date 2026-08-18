import { BROWSER_UA } from '../net/userAgent'
import { strip } from './pool'

/** Browser UA + Referer pointing at the Invidious instance origin. */
export function invidiousRequestHeaders(instance: string): Record<string, string> {
  const origin = strip(instance)
  return {
    Accept: 'application/json',
    'User-Agent': BROWSER_UA,
    Referer: `${origin}/`,
  }
}
