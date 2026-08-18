/** Compare <track> src against a (possibly relative) subtitle URL. */

export function trackSrcMatches(el: HTMLTrackElement, url: string): boolean {
  const attr = el.getAttribute('src') ?? ''
  if (attr === url) return true
  try {
    const a = new URL(el.src || attr, window.location.href).href
    const b = new URL(url, window.location.href).href
    return a === b
  } catch {
    return el.src === url
  }
}
