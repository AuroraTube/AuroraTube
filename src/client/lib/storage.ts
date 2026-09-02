/** Client-side localStorage keys and safe accessors. */

export const STORAGE_KEYS = {
  recentVideos: 'auroratube:recentVideos',
  sidebarCollapsed: 'auroratube:sidebar-collapsed',
  mediaProxyEnabled: 'auroratube:media-proxy-enabled',
} as const

export function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function writeJsonItem(key: string, value: unknown): void {
  const store = getLocalStorage()
  if (!store) return
  try {
    store.setItem(key, JSON.stringify(value))
  } catch {
    /* quota / private mode */
  }
}

export function readFlag(key: string): boolean {
  const store = getLocalStorage()
  if (!store) return false
  try {
    return store.getItem(key) === '1'
  } catch {
    return false
  }
}

export function writeFlag(key: string, value: boolean): void {
  const store = getLocalStorage()
  if (!store) return
  try {
    store.setItem(key, value ? '1' : '0')
  } catch {
    /* ignore */
  }
}
