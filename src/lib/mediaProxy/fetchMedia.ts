import { PROXY_MAX_REDIRECTS } from '../net/constants'
import { followRedirects } from '../net/followRedirects'
import { youtubeMediaHeaders } from '../net/youtubeHeaders'
import { parseMediaProxyTarget } from './allowlist'

const FETCH_TIMEOUT_MS = 20_000

export type FetchMediaOptions = {
  range?: string | null
  accept?: string
}

/**
 * Fetch a validated media URL (HLS playlist / segment / progressive).
 * Manual redirects; each hop re-validated against the media allowlist.
 */
export async function fetchMedia(
  target: URL,
  options: FetchMediaOptions = {},
): Promise<Response> {
  const headers = youtubeMediaHeaders({
    Accept: options.accept ?? '*/*',
  })
  if (options.range) headers.Range = options.range

  const { response } = await followRedirects({
    url: target.toString(),
    timeoutMs: FETCH_TIMEOUT_MS,
    maxRedirects: PROXY_MAX_REDIRECTS,
    sameOriginOnly: false,
    validate: (url) => parseMediaProxyTarget(url).toString(),
    init: { headers },
  })
  return response
}
