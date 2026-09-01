import type { ReactNode } from 'react'

/** Centered empty-list message used on channel / search result sections. */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-8 text-center text-sm text-muted">
      {children}
    </div>
  )
}
