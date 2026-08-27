import { IMAGE_FETCH } from '../config'
import { mapPool } from '../util/mapPool'
import { collectRefs } from './collect'
import { IMAGE_ARRAY_KEYS } from './keys'
import { fetchAsDataUri } from './fetch'
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

function isDataUriLeaf(item: unknown): boolean {
  if (typeof item === 'string') return item.startsWith('data:')
  if (item && typeof item === 'object' && 'url' in item) {
    return String((item as { url?: unknown }).url ?? '').startsWith('data:')
  }
  return false
}

/** Keep a single entry per image array; prefer embedded data URIs. */
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
        const arr = record[key] as unknown[]
        const dataIdx = arr.findIndex(isDataUriLeaf)
        record[key] = [arr[dataIdx >= 0 ? dataIdx : 0]]
      }
    }
    for (const child of Object.values(record)) pruneExtraThumbnails(child)
  }
}

/** Replace image URLs in a normalized payload with data: base64 URIs. */
async function embedImages<T>(data: T): Promise<T> {
  if (data == null || typeof data !== 'object') return data

  const refs = collectRefs(data)
  if (!refs.length) return data

  const unique = [...new Set(refs.map((r) => r.url))]
  const resolved = await mapPool(unique, IMAGE_FETCH.concurrency, fetchAsDataUri)
  const byUrl = new Map<string, string>()
  unique.forEach((url, i) => {
    if (resolved[i]) byUrl.set(url, resolved[i]!)
  })

  const clone = structuredClone(data)

  for (const ref of refs) {
    const dataUri = byUrl.get(ref.url)
    if (!dataUri || !isSafePath(ref.path)) continue
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
        ;(cursor as Record<string, unknown>).url = dataUri
      }
    } else {
      setPath(clone, ref.path, dataUri)
    }
  }

  pruneExtraThumbnails(clone)
  return clone
}

/** Never throw: image embed is best-effort for API payloads. */
export async function embedImagesSafe<T>(data: T): Promise<T> {
  try {
    return await embedImages(data)
  } catch (error) {
    logError('images.embed_failed', error instanceof Error ? { errorMessage: error.message } : undefined)
    return data
  }
}
