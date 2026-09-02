import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiClientError } from '@/lib/api'

export type ApiResourceState<T> = {
  data: T | null
  error: string | null
  loading: boolean
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message
  if (error instanceof DOMException && error.name === 'AbortError') return ''
  if (error instanceof Error) return error.message
  return 'Failed to load'
}

type UseApiResourceOptions<T> = {
  /** When false, skip fetch and clear state. Default true. */
  enabled?: boolean
  /** Stable key for the resource; changes trigger refetch. */
  key: string | null
  /** AbortSignal-aware loader. */
  loader: (signal: AbortSignal) => Promise<T>
}

/**
 * Fetch a resource keyed by `key`.
 * - `reload()` clears data/error and re-runs the loader.
 * - Aborts the in-flight request on unmount or key change.
 * - `loader` is read via ref so identity changes do not abort in-flight work.
 */
export function useApiResource<T>({
  key,
  loader,
  enabled = true,
}: UseApiResourceOptions<T>): ApiResourceState<T> & { reload: () => void } {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [tick, setTick] = useState(0)
  const activeKeyRef = useRef<string | null>(null)
  const loaderRef = useRef(loader)
  loaderRef.current = loader
  /** True when the current effect run was triggered by `reload()`. */
  const isReloadRef = useRef(false)

  const reload = useCallback(() => {
    isReloadRef.current = true
    setError(null)
    setData(null)
    setTick((n) => n + 1)
  }, [])

  useEffect(() => {
    if (!enabled || key == null) {
      activeKeyRef.current = null
      setData(null)
      setError(null)
      setLoading(false)
      return
    }

    const keyChanged = activeKeyRef.current !== key
    activeKeyRef.current = key
    if (keyChanged) {
      setData(null)
      setError(null)
    }

    const isReload = isReloadRef.current
    isReloadRef.current = false

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    void loaderRef
      .current(controller.signal)
      .then((next) => {
        if (controller.signal.aborted) return
        setData(next)
        setError(null)
        setLoading(false)
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        const message = errorMessage(err)
        if (!message) {
          setLoading(false)
          return
        }
        setError(message)
        if (keyChanged || isReload) setData(null)
        setLoading(false)
      })

    return () => {
      controller.abort()
    }
  }, [key, enabled, tick])

  return { data, error, loading, reload }
}
