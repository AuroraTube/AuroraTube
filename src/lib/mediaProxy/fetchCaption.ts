import { PROXY_MAX_REDIRECTS } from '../net/constants'
import { followRedirects } from '../net/followRedirects'
import { youtubeMediaHeaders } from '../net/youtubeHeaders'
import { parseCaptionProxyTarget } from './allowlist'

const FETCH_TIMEOUT_MS = 15_000
/** Caption bodies are small; reject oversized responses. */
export const MAX_CAPTION_BYTES = 1_048_576

/**
 * Fetch a validated timedtext URL. Manual redirects; each hop must re-validate.
 */
export async function fetchCaption(target: URL): Promise<Response> {
  const { response } = await followRedirects({
    url: target.toString(),
    timeoutMs: FETCH_TIMEOUT_MS,
    maxRedirects: PROXY_MAX_REDIRECTS,
    sameOriginOnly: false,
    validate: (url) => parseCaptionProxyTarget(url).toString(),
    init: {
      headers: youtubeMediaHeaders({ Accept: 'text/vtt, text/plain, */*' }),
    },
  })
  return response
}
