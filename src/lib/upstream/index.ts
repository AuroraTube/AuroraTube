import { emptyFailureBucket, noteFailure, resolveAllFailed } from '../cascade'
import { isApiException, notFound, rateLimited, upstreamUnavailable } from '../errors'
import { probeUpstreams } from './health'
import { prioritizedInstances } from './pool'
import { requestJson } from './requestJson'

/** How many top instances to race in parallel on the first attempt. */
const RACE_SIZE = 2

type RaceOk<T> = { ok: true; value: T }
type RaceFail = { ok: false; errors: unknown[] }

function raceFirstSuccess<T>(tasks: Array<() => Promise<T>>): Promise<RaceOk<T> | RaceFail> {
  if (!tasks.length) return Promise.resolve({ ok: false, errors: [] })

  return new Promise((resolve) => {
    let pending = tasks.length
    const errors: unknown[] = []
    let settled = false

    for (const task of tasks) {
      task().then(
        (value) => {
          if (settled) return
          settled = true
          resolve({ ok: true, value })
        },
        (error) => {
          errors.push(error)
          pending -= 1
          if (pending === 0 && !settled) {
            resolve({ ok: false, errors })
          }
        },
      )
    }
  })
}

/**
 * Try Invidious instances until one succeeds.
 * Top instances are raced in parallel; the rest are sequential.
 */
export async function fetchUpstreamJson<T>(
  paths: string | string[],
  init?: RequestInit,
): Promise<T> {
  const candidates = Array.isArray(paths) ? paths : [paths]
  const bucket = emptyFailureBucket()
  let attempts = 0
  let sawRateLimit = false

  const prioritized = prioritizedInstances()
  const raceGroup = prioritized.slice(0, RACE_SIZE)
  const rest = prioritized.slice(RACE_SIZE)

  const absorb = (errors: unknown[]) => {
    for (const error of errors) {
      noteFailure(bucket, error)
      if (isApiException(error) && error.code === 'RATE_LIMITED') sawRateLimit = true
    }
  }

  if (raceGroup.length) {
    const tasks: Array<() => Promise<T>> = []
    for (const instance of raceGroup) {
      for (const path of candidates) {
        attempts++
        tasks.push(() => requestJson<T>(instance, path, init))
      }
    }
    const raced = await raceFirstSuccess(tasks)
    if (raced.ok) return raced.value
    absorb(raced.errors)
  }

  for (const instance of rest) {
    for (const path of candidates) {
      attempts++
      try {
        return await requestJson<T>(instance, path, init)
      } catch (error) {
        absorb([error])
      }
    }
  }

  if (attempts === 0) throw upstreamUnavailable()

  // Prefer explicit rate-limit signal when that was the dominant soft failure.
  if (!bucket.sawHardNotFound && sawRateLimit && !isApiException(bucket.lastSoftError)) {
    throw rateLimited()
  }

  try {
    resolveAllFailed(bucket, 'Not found')
  } catch (error) {
    if (isApiException(error) && error.code === 'NOT_FOUND') throw notFound()
    throw error
  }
}

export { probeUpstreams }

export { classifyJsonBody, classifyErrorText } from './classifyBody'
