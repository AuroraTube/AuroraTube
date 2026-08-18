import type { ReactNode } from 'react'

type PillOption<T extends string> = {
  value: T
  label: ReactNode
}

type PillGroupProps<T extends string> = {
  value: T
  options: readonly PillOption<T>[]
  onChange: (value: T) => void
  className?: string
}

export function PillGroup<T extends string>({
  value,
  options,
  onChange,
  className = '',
}: PillGroupProps<T>) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`.trim()}>
      {options.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              'rounded-lg px-3 py-1.5 text-sm font-medium transition',
              active ? 'bg-ink text-white' : 'bg-chip text-ink hover:bg-[#e5e5e5]',
            ].join(' ')}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
