import type { ImageRef } from './types'
import { canonicalizeImageUrl } from './canonicalize'
import { SCALAR_IMAGE_KEYS, isImageArrayKey } from './keys'

function isImageField(parentPath: string[], key: string): boolean {
  if (SCALAR_IMAGE_KEYS.has(key)) return true
  if (key === 'url' && parentPath.some((p) => isImageArrayKey(p))) return true
  return false
}

/** Max candidates per image array (embed first success; prune keeps one). */
const IMAGE_ARRAY_EMBED_LIMIT = 3

export function collectRefs(value: unknown, path: string[] = [], out: ImageRef[] = []): ImageRef[] {
  if (Array.isArray(value)) {
    const parentKey = path[path.length - 1]
    if (parentKey && isImageArrayKey(parentKey)) {
      const limit = Math.min(value.length, IMAGE_ARRAY_EMBED_LIMIT)
      for (let i = 0; i < limit; i++) {
        if (value[i] !== undefined) collectRefs(value[i], [...path, String(i)], out)
      }
      return out
    }
    value.forEach((item, i) => collectRefs(item, [...path, String(i)], out))
    return out
  }

  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (typeof child === 'string' && isImageField(path, key)) {
        const url = canonicalizeImageUrl(child)
        if (url && !url.startsWith('data:')) out.push({ path: [...path, key], url })
      } else {
        collectRefs(child, [...path, key], out)
      }
    }
  }
  return out
}
