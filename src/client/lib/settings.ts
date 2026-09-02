/**
 * User-facing playback settings, persisted to localStorage.
 *
 * Currently just the media-proxy toggle: whether *progressive* (non-HLS)
 * video/audio requests are routed through `/api/media-proxy` (useful when
 * the proxy is flaky and the user would rather hit the origin CDN directly,
 * at the cost of the CORS / referrer / IP-lock workarounds the proxy
 * provides). HLS playback always uses the proxy regardless of this setting
 * (see `toProxiedHlsUrl` in `@/lib/mediaProxy`).
 *
 * Default is OFF (do not proxy media) per product decision — the proxy is
 * opt-in, not opt-out.
 */
import { useSyncExternalStore } from 'react'
import { STORAGE_KEYS, readFlag, writeFlag } from '@/lib/storage'

const listeners = new Set<() => void>()

let cached = readFlag(STORAGE_KEYS.mediaProxyEnabled)

function emit(): void {
  for (const listener of listeners) listener()
}

/** Read the current media-proxy setting synchronously (non-reactive). */
export function getMediaProxyEnabled(): boolean {
  return cached
}

/** Persist and broadcast a new media-proxy setting. */
export function setMediaProxyEnabled(value: boolean): void {
  cached = value
  writeFlag(STORAGE_KEYS.mediaProxyEnabled, value)
  emit()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** React hook: current media-proxy setting, updates live across components/tabs-in-app. */
export function useMediaProxyEnabled(): boolean {
  return useSyncExternalStore(subscribe, getMediaProxyEnabled, () => false)
}
