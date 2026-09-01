import { mediaProxyPath } from '../mediaProxy'
import { collectRefs } from './collect'
import { IMAGE_ARRAY_KEYS } from './keys'
import { logError } from '../log'

const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

function isSafePath(path: string[]): boolean {
  return path.every((segment) => segment !== '' && !FORBIDDEN_KEYS.has(segment))
}

function setPath(root: unknown, path: string[], value: string): void {
  if (!isSafePath(path)) return
  let cursor: unknown = root
  for (let i = 0; i < path.length - 1; i++) {
    if (cursor == null || typeof cursor !== 'object') return
    cursor = (cursor as Record<string, unknown>)[path[i]]
  }
  if (cursor != null && typeof cursor === 'object') {
    const key = path[path.length - 1]
    if (FORBIDDEN_KEYS.has(key)) return
    ;(cursor as Record<string, unknown>)[key] = value
  }
}

/** Keep a single entry per image array (the first candidate; see collectRefs). */
function pruneExtraThumbnails(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(pruneExtraThumbnails)
    return
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    for (const key of Object.keys(record)) {
      if (FORBIDDEN_KEYS.has(key)) continue
      if (IMAGE_ARRAY_KEYS.has(key) && Array.isArray(record[key]) && (record[key] as unknown[]).length > 1) {
        record[key] = [(record[key] as unknown[])[0]]
      }
    }
    for (const child of Object.values(record)) pruneExtraThumbnails(child)
  }
}

/**
 * Rewrite image URLs in a normalized payload to route through the
 * same-origin `/api/media-proxy` (no server-side fetch, no base64 embed).
 * Each image field ends up as a single proxied URL rather than an array
 * of candidates.
 */
function rewriteImages<T>(data: T): T {
  if (data == null || typeof data !== 'object') return data

  const refs = collectRefs(data)
  if (!refs.length) return data

  const clone = structuredClone(data)

  for (const ref of refs) {
    if (!isSafePath(ref.path)) continue
    const proxied = mediaProxyPath(ref.url)
    const leafKey = ref.path[ref.path.length - 1]
    if (leafKey === 'url') {
      const parent = ref.path.slice(0, -1)
      let cursor: unknown = clone
      for (const key of parent) {
        if (cursor == null || typeof cursor !== 'object') {
          cursor = null
          break
        }
        cursor = (cursor as Record<string, unknown>)[key]
      }
      if (cursor && typeof cursor === 'object') {
        ;(cursor as Record<string, unknown>).url = proxied
      }
    } else {
      setPath(clone, ref.path, proxied)
    }
  }

  pruneExtraThumbnails(clone)
  return clone
}

/** Never throw: image URL rewrite is best-effort for API payloads. */
export async function embedImagesSafe<T>(data: T): Promise<T> {
  try {
    return rewriteImages(data)
  } catch (error) {
    logError('images.rewrite_failed', error instanceof Error ? { errorMessage: error.message } : undefined)
    return data
  }
}
