/** Append `next` items whose `id` is not already present in `prev` (stable order). */
export function mergeById<T extends { id: string }>(prev: T[], next: T[]): T[] {
  if (!next.length) return prev
  const seen = new Set(prev.map((item) => item.id))
  const out = [...prev]
  for (const item of next) {
    if (!item.id || seen.has(item.id)) continue
    seen.add(item.id)
    out.push(item)
  }
  return out
}
