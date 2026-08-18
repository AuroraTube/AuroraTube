import { UPSTREAM } from '../config'
import {
  isApiException,
  notFound,
  rateLimited,
  upstreamBadResponse,
  upstreamTimeout,
  upstreamUnavailable,
} from '../errors'
import { UPSTREAM_MAX_REDIRECTS, fetchJsonWithRedirectGuard } from '../net/fetchJson'
import { absolutizeUrls } from '../urls'
import { classifyErrorText } from './classifyBody'
import { invidiousRequestHeaders } from './headers'
import { markFailure, markSuccess, strip } from './pool'

function looksLikeJson(contentType: string | null): boolean {
  if (!contentType) return true
  const ct = contentType.toLowerCase()
  return ct.includes('json') || ct.includes('javascript') || ct.includes('text/plain')
}

function throwBodyError(message: string): never {
  const kind = classifyErrorText(message)
  if (kind === 'not_found') throw notFound(message)
  if (kind === 'rate_limited') throw rateLimited()
  if (kind === 'unavailable') throw upstreamUnavailable()
  throw upstreamBadResponse()
}

/** Single-instance JSON fetch with timeout, error classification, and URL absolutization. */
export async function requestJson<T>(
  instance: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const base = strip(instance)
  try {
    const headers = new Headers(invidiousRequestHeaders(base))
    if (init?.headers) {
      const extra = new Headers(init.headers)
      extra.forEach((value, key) => {
        // Caller may not override UA / Referer for Invidious policy.
        if (key.toLowerCase() === 'user-agent' || key.toLowerCase() === 'referer') return
        headers.set(key, value)
      })
    }

    const startUrl = `${base}${path}`

    const { response, finalUrl } = await fetchJsonWithRedirectGuard(startUrl, {
      ...init,
      timeoutMs: UPSTREAM.timeoutMs,
      maxRedirects: UPSTREAM_MAX_REDIRECTS,
      headers,
    })

    if (response.status === 404) throw notFound('Resource not found')

    if (response.status === 429) {
      markFailure(instance, UPSTREAM.rateLimitCooldownMs)
      throw rateLimited()
    }

    if (response.status === 403 || response.status === 401) {
      markFailure(instance)
      throw upstreamUnavailable()
    }

    if (!response.ok) {
      if (response.status >= 500 || response.status === 408) {
        markFailure(instance)
        throw upstreamUnavailable()
      }
      markFailure(instance, 5_000)
      throw upstreamBadResponse()
    }

    if (!looksLikeJson(response.headers.get('content-type'))) {
      markFailure(instance, 10_000)
      throw upstreamBadResponse()
    }

    let raw: unknown
    try {
      raw = await response.json()
    } catch {
      markFailure(instance, 10_000)
      throw upstreamBadResponse()
    }

    if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'error' in (raw as object)) {
      const message = String((raw as { error: unknown }).error)
      markFailure(instance, 10_000)
      throwBodyError(message)
    }

    markSuccess(instance)
    return absolutizeUrls(raw, finalUrl) as T
  } catch (error) {
    if (isApiException(error)) throw error

    markFailure(instance)
    const err = error instanceof Error ? error : new Error(String(error))
    if (err.name === 'AbortError' || /timeout/i.test(err.message)) throw upstreamTimeout()
    throw upstreamUnavailable()
  }
}
