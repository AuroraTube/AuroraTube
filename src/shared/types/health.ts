/** Health and trending response types. */

import type { VideoSummary } from './video'

export type HealthResponse = {
  worker: 'ok'
  upstream: 'ok' | 'degraded' | 'down'
  timestamp: string
}

export type TrendingResponse = {
  videos: VideoSummary[]
}
