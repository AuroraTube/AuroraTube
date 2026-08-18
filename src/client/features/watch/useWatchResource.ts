import { useCallback } from 'react'
import type { VideoDetail } from '@shared/types'
import { apiGet } from '@/lib/api'
import { useApiResource } from '@/hooks/useApiResource'

export function useWatchResource(videoId: string | undefined) {
  const loader = useCallback(
    (signal: AbortSignal) => {
      if (!videoId) return Promise.reject(new Error('Missing videoId'))
      return apiGet<VideoDetail>(`/api/watch/${encodeURIComponent(videoId)}`, {
        signal,
      })
    },
    [videoId],
  )

  return useApiResource<VideoDetail>({
    key: videoId ?? null,
    enabled: Boolean(videoId),
    loader,
  })
}
