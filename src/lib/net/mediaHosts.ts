import { INVIDIOUS_INSTANCES } from '../config'
import { isBlockedHostname } from './hosts'

/**
 * Hosts allowed in playback / stream media URLs (progressive + HLS).
 * Stricter path rules for youtube.com live in mediaProxy allowlist.
 */
const MEDIA_HOST_SUFFIXES = [
  'googlevideo.com',
  'youtube.com',
  'youtu.be',
  'ytimg.com',
  'ggpht.com',
  'googleusercontent.com',
  'siatube.com',
] as const

const invidiousHosts = new Set(
  INVIDIOUS_INSTANCES.map((u) => {
    try {
      return new URL(u).hostname.toLowerCase()
    } catch {
      return ''
    }
  }).filter(Boolean),
)

export function isInvidiousHostname(hostname: string): boolean {
  return invidiousHosts.has(hostname.toLowerCase())
}

export function isAllowedMediaHostname(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (isBlockedHostname(host)) return false
  if (invidiousHosts.has(host)) return true
  return MEDIA_HOST_SUFFIXES.some((s) => host === s || host.endsWith(`.${s}`))
}
