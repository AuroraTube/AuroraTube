import { matchWebCache, putWebCache } from './webcache'

type MemoryEntry = {
  expiresAt: number
  payload: unknown
  /** Insertion / last-access order for LRU eviction. */
  touchedAt: number
}

const memory = new Map<string, MemoryEntry>()
const inflight = new Map<string, Promise<unknown>>()

/** Soft cap so unbounded unique keys cannot grow isolate memory without bound. */
const MAX_MEMORY_ENTRIES = 512

const now = () => Date.now()

function touch(key: string, entry: MemoryEntry): void {
  entry.touchedAt = now()
  // Re-insert to keep Map iteration roughly LRU-friendly on eviction scans.
  memory.delete(key)
  memory.set(key, entry)
}

function evictExpiredAndOverflow(): void {
  const t = now()
  for (const [key, entry] of memory) {
    if (entry.expiresAt <= t) memory.delete(key)
  }
  while (memory.size > MAX_MEMORY_ENTRIES) {
    let oldestKey: string | null = null
    let oldestTouch = Infinity
    for (const [key, entry] of memory) {
      if (entry.touchedAt < oldestTouch) {
        oldestTouch = entry.touchedAt
        oldestKey = key
      }
    }
    if (oldestKey == null) break
    memory.delete(oldestKey)
  }
}

export async function getCachedJson<T>(key: string, ttlSeconds: number): Promise<T | null> {
  const hit = memory.get(key)
  if (hit) {
    if (hit.expiresAt > now()) {
      touch(key, hit)
      return hit.payload as T
    }
    memory.delete(key)
  }

  const response = await matchWebCache(key)
  if (!response) return null

  try {
    const body = (await response.json()) as { payload?: T } | null
    if (!body || typeof body !== 'object' || !('payload' in body)) return null
    const entry: MemoryEntry = {
      expiresAt: now() + ttlSeconds * 1000,
      payload: body.payload,
      touchedAt: now(),
    }
    memory.set(key, entry)
    evictExpiredAndOverflow()
    return body.payload ?? null
  } catch {
    return null
  }
}

/** Memory write always succeeds; Cache API is best-effort. */
export async function setCachedJson<T>(key: string, payload: T, ttlSeconds: number): Promise<void> {
  memory.set(key, {
    expiresAt: now() + ttlSeconds * 1000,
    payload,
    touchedAt: now(),
  })
  evictExpiredAndOverflow()
  await putWebCache(key, JSON.stringify({ payload }), ttlSeconds)
}

/**
 * Single-flight cache loader.
 * Concurrent loads for the same key coalesce under one in-flight promise.
 */
export async function getOrSetCachedJson<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const cached = await getCachedJson<T>(key, ttlSeconds)
  if (cached !== null) return cached

  const existing = inflight.get(key)
  if (existing) return existing as Promise<T>

  const promise = (async () => {
    try {
      const again = await getCachedJson<T>(key, ttlSeconds)
      if (again !== null) return again
      const value = await loader()
      await setCachedJson(key, value, ttlSeconds)
      return value
    } finally {
      inflight.delete(key)
    }
  })()

  inflight.set(key, promise)
  return promise
}
