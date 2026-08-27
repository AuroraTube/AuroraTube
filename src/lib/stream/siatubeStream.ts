import type { StreamPayload } from '../../shared/types'
import { SIATUBE_STREAM_BASE, UPSTREAM } from '../config'
import { UPSTREAM_MAX_REDIRECTS, fetchJsonWithRedirectGuard } from '../net/fetchJson'
import { classifyJsonBody } from '../upstream/classifyBody'
import { normalizeStreamPayload } from './normalize'

/**
 * SiaTube `/api/stream/:id`.
 * - payload on success
 * - `null` definitive not-found
 * - `undefined` soft failure (try fallbacks) — 429, timeouts, empty qualities, network
 *
 * Never throws: failures are null/undefined so the cascade can continue.
 */
export async function fetchSiaTubeStream(
  videoId: string,
): Promise<StreamPayload | null | undefined> {
  const url = `${SIATUBE_STREAM_BASE}/${encodeURIComponent(videoId)}`

  try {
    const { response } = await fetchJsonWithRedirectGuard(url, {
      timeoutMs: UPSTREAM.timeoutMs,
      maxRedirects: UPSTREAM_MAX_REDIRECTS,
      headers: { accept: 'application/json' },
    })

    if (response.status === 404 || response.status === 410) return null
    if (!response.ok) return undefined

    let raw: unknown
    try {
      raw = await response.json()
    } catch {
      return undefined
    }

    const kind = classifyJsonBody(raw)
    if (kind === 'not_found') return null
    if (kind) return undefined

    const normalized = normalizeStreamPayload(raw)
    if (!normalized.qualities.length) return undefined
    return normalized
  } catch {
    return undefined
  }
}
