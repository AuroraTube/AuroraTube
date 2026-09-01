import type { Context } from 'hono'
import { isApiException, type ApiException } from '../lib/errors'

export function jsonError(error: ApiException) {
  return Response.json({ ok: false, error: error.toJSON() }, { status: error.status })
}

export function withApiErrors<T>(
  handler: (c: Context) => Promise<T>,
): (c: Context) => Promise<Response> {
  return async (c) => {
    try {
      const data = await handler(c)
      return c.json({ ok: true, data })
    } catch (error) {
      if (isApiException(error)) return jsonError(error)
      throw error
    }
  }
}
