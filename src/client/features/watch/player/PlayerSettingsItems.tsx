import type { ReactNode } from 'react'

/** Navigable root-menu row (label + current value + chevron). */
export function MenuRow({
  label,
  value,
  onClick,
  disabled,
  icon,
}: {
  label: string
  value: string
  onClick: () => void
  disabled?: boolean
  icon?: ReactNode
}) {
  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {icon}
        <span className="flex-1">{label}</span>
        <span className="max-w-[7rem] truncate text-xs text-white/60">{value}</span>
        <span className="text-white/40">›</span>
      </button>
    </li>
  )
}

/** Nested panel with optional back control. */
export function SubPanel({
  title,
  onBack,
  children,
}: {
  title: string
  onBack?: () => void
  children: ReactNode
}) {
  return (
    <div className="max-h-64 overflow-y-auto py-1">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex w-full items-center gap-2 border-b border-white/10 px-3 py-2.5 text-left font-medium hover:bg-white/10"
        >
          <span className="text-white/60">‹</span>
          {title}
        </button>
      ) : (
        <div className="border-b border-white/10 px-3 py-2.5 font-medium">{title}</div>
      )}
      <ul>{children}</ul>
    </div>
  )
}

/** Selectable option row with checkmark. */
export function ChoiceRow({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-white/10"
      >
        <span className="w-4 text-center text-red-500">{selected ? '✓' : ''}</span>
        <span className="min-w-0 flex-1 truncate">{label}</span>
      </button>
    </li>
  )
}
