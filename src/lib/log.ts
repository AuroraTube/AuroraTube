/**
 * Lightweight structured logging for upstream / cascade observability.
 * Emits a single JSON line so log aggregators can parse fields reliably.
 */

type LogFields = Record<string, string | number | boolean | null | undefined>

function serialize(level: string, message: string, fields?: LogFields): string {
  const payload: Record<string, unknown> = {
    level,
    msg: message,
    ts: new Date().toISOString(),
  }
  if (fields) {
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) payload[key] = value
    }
  }
  return JSON.stringify(payload)
}

export function logWarn(message: string, fields?: LogFields): void {
  console.warn(serialize('warn', message, fields))
}

export function logError(message: string, fields?: LogFields): void {
  console.error(serialize('error', message, fields))
}

/**
 * Extract stable fields from an unknown error for structured logs.
 * Includes a short stack tip (first frames only) — never secrets/URLs from callers.
 */
export function errorFields(error: unknown): LogFields {
  if (error && typeof error === 'object') {
    const e = error as {
      name?: string
      message?: string
      code?: string
      status?: number
      stack?: string
    }
    const stackTip =
      typeof e.stack === 'string'
        ? e.stack
            .split('\n')
            .slice(0, 4)
            .map((line) => line.trim())
            .filter(Boolean)
            .join(' | ')
            .slice(0, 500)
        : undefined
    return {
      errorName: typeof e.name === 'string' ? e.name : undefined,
      errorMessage: typeof e.message === 'string' ? e.message.slice(0, 500) : undefined,
      errorCode: typeof e.code === 'string' ? e.code : undefined,
      errorStatus: typeof e.status === 'number' ? e.status : undefined,
      errorStack: stackTip,
    }
  }
  if (typeof error === 'string') return { errorMessage: error.slice(0, 500) }
  return { errorMessage: String(error).slice(0, 500) }
}
