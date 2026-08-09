import type { ReactNode } from 'react'

export function SearchEmptyState({ children = '見つかりませんでした。' }: { children?: ReactNode }) {
  return <p className="text-sm text-muted">{children}</p>
}
