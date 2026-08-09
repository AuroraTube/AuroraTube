import type { ReactNode } from 'react'

export function InlineStatus({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'error'
}) {
  return (
    <div
      className={[
        'rounded-xl border p-4 text-sm',
        tone === 'error'
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-line bg-white text-muted',
      ].join(' ')}
    >
      {children}
    </div>
  )
}
