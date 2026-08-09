/**
 * Shared SiaTube JSON fetch (video metadata, comments, etc.).
 */
import { SIATUBE_BASE, UPSTREAM } from '../config'
import {
  isApiException,
  notFound,
  rateLimited,
  upstreamBadResponse,
  upstreamTimeout,
  upstreamUnavailable,
} from '../errors'
import { UPSTREAM_MAX_REDIRECTS, fetchJsonWithRedirectGuard } from '../net/fetchJson'
import { classifyJsonBody, type BodyFailureKind } from '../upstream/classifyBody'

function throwForKind(kind: BodyFailureKind, detail?: string): never {
  switch (kind) {
    case 'not_found':
      throw notFound(detail || 'Resource not found')
    case 'rate_limited':
      throw rateLimited()
    case 'unavailable':
      throw upstreamUnavailable()
    default:
      throw upstreamBadResponse()
  }
}

export async function fetchSiaTubeJson<T = unknown>(
  pathAndQuery: string,
  init?: RequestInit,
): Promise<T> {
  const path = pathAndQuery.startsWith('/') ? pathAndQuery : `/${pathAndQuery}`

  try {
    const headers = new Headers(init?.headers)
    headers.set('accept', 'application/json')

    const { response } = await fetchJsonWithRedirectGuard(`${SIATUBE_BASE}${path}`, {
      ...init,
      timeoutMs: UPSTREAM.timeoutMs,
      maxRedirects: UPSTREAM_MAX_REDIRECTS,
      headers,
    })

    if (response.status === 404) throw notFound('Resource not found')
    if (response.status === 410) throw notFound('Resource unavailable')
    if (response.status === 429) throw rateLimited()
    if (!response.ok) {
      if (response.status >= 500) throw upstreamUnavailable()
      throw upstreamBadResponse()
    }

    let raw: unknown
    try {
      raw = await response.json()
    } catch {
      throw upstreamBadResponse()
    }

    const kind = classifyJsonBody(raw)
    if (kind) {
      const obj = raw as Record<string, unknown>
      const detail = String(obj.reason ?? obj.message ?? obj.error ?? '')
      throwForKind(kind, detail || undefined)
    }

    return raw as T
  } catch (error) {
    if (isApiException(error)) throw error
    const err = error instanceof Error ? error : new Error(String(error))
    if (err.name === 'AbortError' || /timeout/i.test(err.message)) throw upstreamTimeout()
    throw upstreamUnavailable()
  }
}
