import type { ReactNode } from 'react'

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight text-ink md:text-xl">{title}</h2>
        {subtitle ? <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}
