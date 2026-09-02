/** Minimal HTML → plain text for comment / community bodies. */

const NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

function decodeEntity(entity: string): string {
  if (entity.startsWith('#x') || entity.startsWith('#X')) {
    const n = Number.parseInt(entity.slice(2), 16)
    if (Number.isFinite(n) && n > 0 && n < 0x110000) {
      try {
        return String.fromCodePoint(n)
      } catch {
        return ''
      }
    }
    return ''
  }
  if (entity.startsWith('#')) {
    const n = Number.parseInt(entity.slice(1), 10)
    if (Number.isFinite(n) && n > 0 && n < 0x110000) {
      try {
        return String.fromCodePoint(n)
      } catch {
        return ''
      }
    }
    return ''
  }
  return NAMED[entity.toLowerCase()] ?? ''
}

/**
 * Strip tags and decode common entities. Output is plain text suitable for
 * React text nodes (not HTML). Does not attempt full HTML sanitization.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&([a-zA-Z]+|#x?[0-9a-fA-F]+);/g, (_, entity: string) => decodeEntity(entity))
    .replace(/\u0000/g, '')
    .trim()
}
