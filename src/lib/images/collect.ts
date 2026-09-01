import type { ImageRef } from './types'
import { canonicalizeImageUrl } from './canonicalize'
import { SCALAR_IMAGE_KEYS, isImageArrayKey } from './keys'

function isImageField(parentPath: string[], key: string): boolean {
  if (SCALAR_IMAGE_KEYS.has(key)) return true
  if (key === 'url' && parentPath.some((p) => isImageArrayKey(p))) return true
  return false
}

export function collectRefs(value: unknown, path: string[] = [], out: ImageRef[] = []): ImageRef[] {
  if (Array.isArray(value)) {
    const parentKey = path[path.length - 1]
    if (parentKey && isImageArrayKey(parentKey)) {
      // Only the single entry that survives pruneExtraThumbnails needs a ref.
      if (value.length && value[0] !== undefined) collectRefs(value[0], [...path, '0'], out)
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
