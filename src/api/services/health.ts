import type { HealthResponse } from '../../shared/types'
import { probeUpstreams } from '../../lib/upstream'

export async function getHealth(): Promise<HealthResponse> {
  return {
    worker: 'ok',
    upstream: await probeUpstreams(),
    timestamp: new Date().toISOString(),
  }
}
