/** Pick one element uniformly; undefined when empty. */
export function pickRandom<T>(items: readonly T[]): T | undefined {
  if (!items.length) return undefined
  return items[Math.floor(Math.random() * items.length)]
}
