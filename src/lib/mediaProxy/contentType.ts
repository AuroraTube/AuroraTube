/** Content-Type guards for media-proxy responses. */

function baseType(contentType: string): string {
  return contentType.toLowerCase().split(';')[0].trim()
}

function isDangerousContentType(ct: string): boolean {
  return (
    ct.includes('html') ||
    ct.includes('javascript') ||
    ct.includes('ecmascript') ||
    ct === 'application/xhtml+xml' ||
    ct === 'text/xml' ||
    ct === 'application/xml'
  )
}

/** Captions: VTT / plain / TTML only — never HTML/JS/JSON or arbitrary text/*. */
export function isCaptionContentType(contentType: string): boolean {
  const ct = baseType(contentType)
  if (!ct) return false
  if (isDangerousContentType(ct)) return false
  if (ct.includes('json')) return false
  return (
    ct === 'text/vtt' ||
    ct === 'text/plain' ||
    ct === 'application/ttml+xml' ||
    ct === 'application/xml+ttml' ||
    ct.includes('vtt') ||
    ct === 'application/octet-stream'
  )
}

/** Media segments / playlists: reject active document types; empty type is common on CDNs. */
export function isSafeMediaContentType(contentType: string): boolean {
  const ct = baseType(contentType)
  if (!ct) return true
  return !isDangerousContentType(ct)
}
