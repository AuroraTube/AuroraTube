/**
 * Operational constants and upstream endpoints.
 * Provider-specific stream keys live under stream/fallback/* (e.g. RapidAPI).
 */

/**
 * Invidious instances for catalog (search/channel/playlist/trending) and comments fallback.
 * Ops: review dead/hostile hosts via /api/health; no auto-discovery. Order affects race priority.
 */
export const INVIDIOUS_INSTANCES = [
  'https://yt.omada.cafe',
  'https://invidious.ritoge.com',
  'https://invidious.flokinet.to',
  'https://y.com.sb',
  'https://inv.nadeko.net',
  'https://inv.zzls.xyz',
  'https://iv.catgirl.cloud',
  'https://invidious.ducks.party',
  'https://invidious.f5.si',
  'https://invidious.tiekoetter.com',
  'https://invidious.darkness.services',
  'https://yewtu.be',
  'https://inv.vern.cc',
  'https://yt.vern.cc',
] as const

export const UPSTREAM = {
  /** Per-instance JSON timeout; keep modest so dead instances fail over quickly. */
  timeoutMs: 10_000,
  failureCooldownMs: 12_000,
  rateLimitCooldownMs: 30_000,
} as const

/** Cache TTLs in seconds. */
export const CACHE_TTL = {
  search: 300,
  watch: 180,
  stream: 120,
  comments: 120,
  channel: 600,
  playlist: 600,
  trending: 600,
  image: 86_400,
} as const

/** Fixed region for Invidious trending (`type=default`). */
export const TRENDING_REGION = 'JP' as const

export const IMAGE_FETCH = {
  timeoutMs: 8_000,
  maxBytes: 1_500_000,
  concurrency: 8,
} as const

/** Primary watch / stream / comments provider. */
export const SIATUBE_BASE = 'https://siatube.com' as const
export const SIATUBE_STREAM_BASE = `${SIATUBE_BASE}/api/stream` as const

/** Last-resort stream fallback: getlate (360p muxed; URL via Location header). */
export const GETLATE_STREAM = {
  base: 'https://getlate.dev/api/tools/youtube-live-downloader',
  formatId: '360p',
  timeoutMs: 20_000,
} as const
