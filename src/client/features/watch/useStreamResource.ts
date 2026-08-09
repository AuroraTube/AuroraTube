import { useCallback } from 'react'
import type { StreamPayload } from '@shared/types'
import { apiGet } from '@/lib/api'
import { useApiResource } from '@/hooks/useApiResource'

export function useStreamResource(videoId: string | undefined) {
  const loader = useCallback(
    (signal: AbortSignal) => {
      if (!videoId) return Promise.reject(new Error('Missing videoId'))
      return apiGet<StreamPayload>(`/api/stream/${encodeURIComponent(videoId)}`, {
        signal,
      })
    },
    [videoId],
  )

  return useApiResource<StreamPayload>({
    key: videoId ? `stream:${videoId}` : null,
    enabled: Boolean(videoId),
    loader,
  })
}
