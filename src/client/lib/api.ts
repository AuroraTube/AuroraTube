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

export type ApiGetOptions = {
  signal?: AbortSignal
}

/** In-flight GET dedupe: concurrent identical paths share one network request. */
const inflight = new Map<string, Promise<unknown>>()

async function fetchEnvelope<T>(path: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      headers: { accept: 'application/json' },
      credentials: 'same-origin',
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

/**
 * Typed GET against same-origin `/api/*`.
 * Concurrent calls with the same path share a single in-flight fetch.
 * Per-call AbortSignal still aborts only that caller's wait; the shared
 * request continues for other subscribers.
 */
export async function apiGet<T>(path: string, options?: ApiGetOptions): Promise<T> {
  if (!path.startsWith('/api/')) {
    throw new ApiClientError('BAD_REQUEST', 'Invalid API path', false)
  }

  const signal = options?.signal

  let shared = inflight.get(path) as Promise<T> | undefined
  if (!shared) {
    shared = fetchEnvelope<T>(path).finally(() => {
      inflight.delete(path)
    })
    inflight.set(path, shared)
  }

  if (!signal) return shared

  return new Promise<T>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
      return
    }
    const onAbort = () => {
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
    }
    signal.addEventListener('abort', onAbort, { once: true })
    shared!.then(
      (value) => {
        signal.removeEventListener('abort', onAbort)
        resolve(value)
      },
      (error) => {
        signal.removeEventListener('abort', onAbort)
        reject(error)
      },
    )
  })
}
