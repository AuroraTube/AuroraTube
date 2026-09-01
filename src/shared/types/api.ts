/** API envelope and error types. */

export type APIErrorCode =
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'UPSTREAM_TIMEOUT'
  | 'UPSTREAM_UNAVAILABLE'
  | 'UPSTREAM_BAD_RESPONSE'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'

export type APIError = {
  code: APIErrorCode
  message: string
  retryable: boolean
}

export type APIEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: APIError }
