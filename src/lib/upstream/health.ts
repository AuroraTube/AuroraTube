import { invidiousRequestHeaders } from './headers'
import { orderedInstances } from './pool'

export async function probeUpstreams(): Promise<'ok' | 'degraded' | 'down'> {
  const sample = orderedInstances().slice(0, 6)
  const results = await Promise.allSettled(
    sample.map(async (instance) => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort('timeout'), 5_000)
      try {
        const response = await fetch(`${instance}/api/v1/stats`, {
          signal: controller.signal,
          headers: invidiousRequestHeaders(instance),
        })
        if (!response.ok) return false
        const ct = response.headers.get('content-type') ?? ''
        return ct.includes('json')
      } finally {
        clearTimeout(timer)
      }
    }),
  )
  const ok = results.filter((r) => r.status === 'fulfilled' && r.value).length
  if (ok === 0) return 'down'
  if (ok < Math.ceil(sample.length / 2)) return 'degraded'
  return 'ok'
}
