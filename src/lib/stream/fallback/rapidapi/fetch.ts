import type { StreamPayload } from '../../../../shared/types'
import { UPSTREAM_MAX_REDIRECTS } from '../../../net/constants'
import { fetchJsonWithRedirectGuard } from '../../../net/fetchJson'
import { maskSecret } from '../../../util/mask'
import { pickRandom } from '../../../util/random'
import { errorFields, logWarn } from '../../../log'
import { RAPIDAPI_YTSTREAM } from './config'
import { normalizeRapidApiStream } from './normalize'

/**
 * Fetch YTStream RapidAPI `/dl?id=` and normalize.
 * Redirects are followed manually (same-origin, HTTPS only) with per-hop timeout.
 * Keys are fixed in config and rotated locally.
 * Soft-fails (null) so the stream cascade can continue; failures are logged.
 */
export async function fetchRapidApiStream(videoId: string): Promise<StreamPayload | null> {
  const key = pickRandom(RAPIDAPI_YTSTREAM.keys)?.trim()
  if (!key) {
    logWarn('rapidapi.no_key', { operation: 'stream', id: videoId, provider: 'rapidapi' })
    return null
  }

  const url = `${RAPIDAPI_YTSTREAM.base}?id=${encodeURIComponent(videoId)}`
  const keyHint = maskSecret(key)

  const started = Date.now()

  try {
    const { response } = await fetchJsonWithRedirectGuard(url, {
      timeoutMs: RAPIDAPI_YTSTREAM.timeoutMs,
      maxRedirects: UPSTREAM_MAX_REDIRECTS,
      headers: {
        accept: 'application/json',
        'X-RapidAPI-Key': key,
        'X-RapidAPI-Host': RAPIDAPI_YTSTREAM.host,
      },
    })

    if (!response.ok) {
      logWarn('rapidapi.http_error', {
        operation: 'stream',
        id: videoId,
        provider: 'rapidapi',
        status: response.status,
        keyHint,
        durationMs: Date.now() - started,
      })
      return null
    }

    let raw: unknown
    try {
      raw = await response.json()
    } catch (error) {
      logWarn('rapidapi.json_error', {
        operation: 'stream',
        id: videoId,
        provider: 'rapidapi',
        keyHint,
        durationMs: Date.now() - started,
        ...errorFields(error),
      })
      return null
    }
    return normalizeRapidApiStream(raw)
  } catch (error) {
    // Soft-fail into the stream cascade (timeout, redirect reject, network).
    logWarn('rapidapi.fetch_failed', {
      operation: 'stream',
      id: videoId,
      provider: 'rapidapi',
      keyHint,
      durationMs: Date.now() - started,
      ...errorFields(error),
    })
    return null
  }
}
