/** Hostname safety helpers shared by media proxy, image embed, and URL rewrite. */

const BLOCKED_EXACT = new Set([
  'localhost',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  'metadata',
  'metadata.google',
  'kubernetes.default',
  'kubernetes.default.svc',
])

/** True for dotted-decimal IPv4 (any address — never allow literal IPs as proxy targets). */
function isIpv4Literal(hostname: string): boolean {
  const parts = hostname.split('.')
  if (parts.length !== 4) return false
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false
    const n = Number(part)
    return Number.isInteger(n) && n >= 0 && n <= 255
  })
}

/**
 * Reject loopback, link-local, private hostnames, metadata endpoints,
 * and any IP-literal form (IPv4 / IPv6 / decimal / zone id).
 */
export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '')
  if (
    BLOCKED_EXACT.has(host) ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.lan') ||
    host.endsWith('.corp') ||
    host.endsWith('.home') ||
    host.endsWith('.localdomain') ||
    host.endsWith('.intranet')
  ) {
    return true
  }
  // IPv4 dotted literals, pure numeric (decimal IPv4), IPv6 / zone ids, hex IPv4.
  if (isIpv4Literal(host) || /^\d+$/.test(host) || host.includes(':') || /^0x[0-9a-f]+$/i.test(host)) {
    return true
  }
  return false
}

export function isYtimgHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return (
    host === 'i.ytimg.com' ||
    host === 'img.youtube.com' ||
    /^i\d*\.ytimg\.com$/.test(host)
  )
}

export function isGoogleImageHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return (
    host === 'yt3.ggpht.com' ||
    host === 'yt3.googleusercontent.com' ||
    host === 'lh3.googleusercontent.com' ||
    host.endsWith('.ggpht.com') ||
    host.endsWith('.googleusercontent.com')
  )
}
