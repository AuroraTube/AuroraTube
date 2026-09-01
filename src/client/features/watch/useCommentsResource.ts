import { useCallback } from 'react'
import type { CommentsResponse } from '@shared/types'
import { apiGet } from '@/lib/api'
import { useApiResource } from '@/hooks/useApiResource'

export function useCommentsResource(videoId: string | undefined, sort: 'top' | 'new') {
  const loader = useCallback(
    (signal: AbortSignal) => {
      if (!videoId) return Promise.reject(new Error('Missing videoId'))
      const params = new URLSearchParams({ videoId, sort })
      return apiGet<CommentsResponse>(`/api/comments?${params}`, {
        signal,
      })
    },
    [videoId, sort],
  )

  return useApiResource<CommentsResponse>({
    key: videoId ? `${videoId}:${sort}` : null,
    enabled: Boolean(videoId),
    loader,
  })
}
