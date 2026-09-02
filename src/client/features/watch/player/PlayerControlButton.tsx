import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = {
  label: string
  pressed?: boolean
  children: ReactNode
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled' | 'onClick' | 'className'>

/** Shared icon button used across player chrome. */
export function PlayerControlButton({
  label,
  pressed,
  disabled,
  onClick,
  className = '',
  children,
}: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      className={['rounded-full p-2 transition hover:bg-white/10', className].filter(Boolean).join(' ')}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
