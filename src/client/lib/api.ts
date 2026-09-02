import type { APIEnvelope } from '@shared/types'

export class ApiClientError extends Error {
  readonly code: string
  readonly retryable: boolean
  readonly status?: number

  constructor(code: string, message: string, retryable: boolean, status?: number) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code
    this.retryable = retryable
    this.status = status
  }
}

type ApiGetOptions = {
  signal?: AbortSignal
}

type InflightEntry = {
  promise: Promise<unknown>
  controller: AbortController
  subscribers: number
}

/** In-flight GET dedupe: concurrent identical paths share one network request. */
const inflight = new Map<string, InflightEntry>()

async function fetchEnvelope<T>(path: string, signal: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      headers: { accept: 'application/json' },
      credentials: 'same-origin',
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiClientError('INTERNAL_ERROR', 'Network error', true)
  }

  let body: APIEnvelope<T> | null = null
  try {
    body = (await response.json()) as APIEnvelope<T>
  } catch {
    throw new ApiClientError(
      'INTERNAL_ERROR',
      response.ok ? 'Invalid JSON response' : `HTTP ${response.status}`,
      true,
      response.status,
    )
  }

  if (!body || typeof body !== 'object') {
    throw new ApiClientError('INTERNAL_ERROR', 'Empty response', true, response.status)
  }

  if (body.ok === false) {
    throw new ApiClientError(
      body.error?.code ?? 'INTERNAL_ERROR',
      body.error?.message ?? 'Request failed',
      Boolean(body.error?.retryable),
      response.status,
    )
  }

  if (body.ok === true) return body.data

  throw new ApiClientError('INTERNAL_ERROR', 'Unexpected response shape', true, response.status)
}

function abortError(signal: AbortSignal): DOMException {
  return (signal.reason as DOMException) ?? new DOMException('Aborted', 'AbortError')
}

/**
 * Typed GET against same-origin `/api/*`.
 * Concurrent identical paths share one fetch.
 * Shared request aborts only when every subscriber has aborted.
 */
export async function apiGet<T>(path: string, options?: ApiGetOptions): Promise<T> {
  if (!path.startsWith('/api/')) {
    throw new ApiClientError('BAD_REQUEST', 'Invalid API path', false)
  }

  const signal = options?.signal
  if (signal?.aborted) {
    throw abortError(signal)
  }

  let entry = inflight.get(path)
  if (!entry) {
    const controller = new AbortController()
    const promise = fetchEnvelope<T>(path, controller.signal).finally(() => {
      inflight.delete(path)
    })
    entry = { promise, controller, subscribers: 0 }
    inflight.set(path, entry)
  }

  const self = entry
  self.subscribers += 1
  let released = false
  const release = () => {
    if (released) return
    released = true
    self.subscribers -= 1
    if (self.subscribers <= 0) {
      self.controller.abort()
      // Only remove this entry — a newer request may already occupy `path`
      // if it started after this one settled but before every subscriber's
      // release() ran; deleting unconditionally would drop that entry from
      // the dedupe map while it is still in flight.
      if (inflight.get(path) === self) inflight.delete(path)
    }
  }

  if (!signal) {
    try {
      return (await entry.promise) as T
    } finally {
      release()
    }
  }

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      release()
      reject(abortError(signal))
    }
    signal.addEventListener('abort', onAbort, { once: true })
    entry!.promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort)
        release()
        resolve(value as T)
      },
      (error) => {
        signal.removeEventListener('abort', onAbort)
        release()
        reject(error)
      },
    )
  })
}
