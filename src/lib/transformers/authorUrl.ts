/** Derive an @handle-style slug from an Invidious authorUrl path. */
export function handleFromUrl(authorUrl: unknown): string | undefined {
  if (!authorUrl) return undefined
  try {
    const url = new URL(String(authorUrl))
    const parts = url.pathname.split('/').filter(Boolean)
    return parts.at(-1)
  } catch {
    return undefined
  }
}
