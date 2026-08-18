import { useCallback, useEffect, useRef, useState } from 'react'
import { apiGet } from '@/lib/api'

type PageWithContinuation<T> = {
  items: T[]
  continuation?: string
}

type SeedPage<T> = {
  items: T[]
  continuation?: string
}

type Options<TItem, TRaw> = {
  /** Stable resource key; changes reset and refetch. */
  key: string | null
  /** API path without continuation query (absolute /api/...). */
  path: string | null
  /** Map API JSON → items + continuation. */
  select: (data: TRaw) => PageWithContinuation<TItem>
  /** Merge next page items into previous list (dedupe). */
  merge: (prev: TItem[], next: TItem[]) => TItem[]
  enabled?: boolean
  /**
   * Optional first page supplied by a parent (e.g. channel detail).
   * When set, skips the initial network fetch and uses this data.
   */
  seed?: SeedPage<TItem> | null
}

/**
 * Load a continuation-paginated API resource.
 * - Initial load on key/path change (or seed when provided)
 * - `loadMore()` appends using the current continuation token
 * - Aborts in-flight work on unmount / key change
 */
export function useContinuationPage<TItem, TRaw>({
  key,
  path,
  select,
  merge,
  enabled = true,
  seed = null,
}: Options<TItem, TRaw>) {
  const hasSeed = seed != null
  const [items, setItems] = useState<TItem[]>(() => (hasSeed ? seed!.items : []))
  const [continuation, setContinuation] = useState<string | undefined>(() =>
    hasSeed ? seed!.continuation : undefined,
  )
  const [loading, setLoading] = useState(() => !hasSeed && enabled && Boolean(path && key))
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const selectRef = useRef(select)
  const mergeRef = useRef(merge)
  selectRef.current = select
  mergeRef.current = merge

  // Fingerprint so parent re-renders with a new seed object but same data do not reset.
  const seedFingerprint = hasSeed
    ? `${seed!.items.length}:${seed!.continuation ?? ''}:${(seed!.items as { id?: string }[])
        .map((i) => i?.id ?? '')
        .join(',')}`
    : ''

  useEffect(() => {
    if (!hasSeed || !seed) return
    setItems(seed.items)
    setContinuation(seed.continuation)
    setError(null)
    setLoading(false)

  }, [hasSeed, seedFingerprint])

  const loadInitial = useCallback(
    async (force = false) => {
      if (!enabled || !path || !key) return
      if (hasSeed && !force) return

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      setError(null)
      try {
        const raw = await apiGet<TRaw>(path, { signal: controller.signal })
        if (controller.signal.aborted) return
        const page = selectRef.current(raw)
        setItems(page.items)
        setContinuation(page.continuation)
      } catch (err) {
        if (controller.signal.aborted) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : '読み込みに失敗しました')
        setItems([])
        setContinuation(undefined)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    },
    [enabled, path, key, hasSeed],
  )

  useEffect(() => {
    if (hasSeed) return
    void loadInitial()
    return () => abortRef.current?.abort()
  }, [loadInitial, hasSeed])

  const loadMore = useCallback(async () => {
    if (!path || !continuation || loadingMore) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoadingMore(true)
    setError(null)
    try {
      const sep = path.includes('?') ? '&' : '?'
      const url = `${path}${sep}continuation=${encodeURIComponent(continuation)}`
      const raw = await apiGet<TRaw>(url, { signal: controller.signal })
      if (controller.signal.aborted) return
      const page = selectRef.current(raw)
      setItems((prev) => mergeRef.current(prev, page.items))
      setContinuation(page.continuation)
    } catch (err) {
      if (controller.signal.aborted) return
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : '読み込みに失敗しました')
    } finally {
      if (!controller.signal.aborted) setLoadingMore(false)
    }
  }, [path, continuation, loadingMore])

  const reload = useCallback(() => {
    void loadInitial(true)
  }, [loadInitial])

  return {
    items,
    continuation,
    loading,
    loadingMore,
    error,
    reload,
    loadMore,
  }
}
