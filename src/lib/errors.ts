import type { APIError, APIErrorCode } from '../shared/types'

export class ApiException extends Error {
  readonly status: number
  readonly code: APIErrorCode
  readonly retryable: boolean

  constructor(status: number, code: APIErrorCode, message: string, retryable: boolean) {
    super(message)
    this.name = 'ApiException'
    this.status = status
    this.code = code
    this.retryable = retryable
  }

  toJSON(): APIError {
    return { code: this.code, message: this.message, retryable: this.retryable }
  }
}

export function isApiException(error: unknown): error is ApiException {
  return error instanceof ApiException
}

export const badRequest = (message: string) =>
  new ApiException(400, 'BAD_REQUEST', message, false)

export const notFound = (message = 'Not found') =>
  new ApiException(404, 'NOT_FOUND', message, false)

export const rateLimited = () =>
  new ApiException(429, 'RATE_LIMITED', 'Rate limited by upstream', true)

export const upstreamTimeout = () =>
  new ApiException(504, 'UPSTREAM_TIMEOUT', 'Upstream timed out', true)

export const upstreamUnavailable = () =>
  new ApiException(502, 'UPSTREAM_UNAVAILABLE', 'Upstream unavailable', true)

export const upstreamBadResponse = () =>
  new ApiException(502, 'UPSTREAM_BAD_RESPONSE', 'Upstream returned an invalid response', true)
