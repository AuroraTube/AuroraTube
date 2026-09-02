/** Resolve protocol-relative and path-relative URLs against a base origin. */

export function toAbsoluteUrl(value: string, base: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('#')) {
    return trimmed
  }

  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('//')) {
    try {
      return `${new URL(base).protocol}${trimmed}`
    } catch {
      return `https:${trimmed}`
    }
  }
  if (trimmed.startsWith('/')) {
    return `${base.replace(/\/+$/, '')}${trimmed}`
  }
  return null
}

/** True when a string leaf should be treated as a URL during tree walks. */
export function looksLikeUrlString(value: string): boolean {
  const t = value.trim()
  if (!t) return false
  if (/^https?:\/\//i.test(t) || t.startsWith('//')) return true
  return (
    t.startsWith('/vi/') ||
    t.startsWith('/vi_webp/') ||
    t.startsWith('/ggpht/') ||
    t.startsWith('/api/') ||
    t.startsWith('/sb/')
  )
}
