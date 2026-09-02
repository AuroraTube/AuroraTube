type IconProps = { filled?: boolean; className?: string }

export function MenuIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`${className} fill-current`}>
      <path d="M21 6H3V5h18v1zm0 5H3v1h18v-1zm0 6H3v1h18v-1z" />
    </svg>
  )
}

export function CloseIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`${className} fill-none stroke-current stroke-[1.5]`}
    >
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  )
}

export function SearchIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`${className} fill-current`}>
      <path d="M20.87 20.17l-5.59-5.59C16.35 13.35 17 11.75 17 10c0-3.87-3.13-7-7-7s-7 3.13-7 7 3.13 7 7 7c1.75 0 3.35-.65 4.58-1.71l5.59 5.59.7-.7zM10 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
    </svg>
  )
}

export function HomeIcon({ filled = false, className = 'h-6 w-6' }: IconProps) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={`${className} fill-current`}>
        <path d="M4 10.5 12 3l8 7.5V20a1 1 0 0 1-1 1h-5v-7H10v7H5a1 1 0 0 1-1-1z" />
      </svg>
    )
  }
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`${className} fill-none stroke-current stroke-[1.5]`}
    >
      <path
        d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function TrendingIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`${className} fill-none stroke-current stroke-[1.5]`}
    >
      <path d="M4 17 10.5 10.5 14 14l6-6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 8h5v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SearchNavIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`${className} fill-none stroke-current stroke-[1.5]`}
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" strokeLinecap="round" />
    </svg>
  )
}

export function LogoMark({ className = 'h-5 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 20" className={className} aria-hidden="true">
      <rect width="28" height="20" rx="6" fill="#FF0000" />
      <path d="M11 5.5v9l8-4.5-8-4.5z" fill="white" />
    </svg>
  )
}

/** Precise 8-tooth gear, symmetric under 45° rotation (unlike the previous hand-tuned path). */
const GEAR_PATH =
  'M10.15 5.09 10.5 2.52h3l.35 2.57 1.73.72 2.06-1.58 2.13 2.13-1.58 2.07.72 1.72 2.57.35v3l-2.57.35-.72 1.72 1.58 2.07-2.13 2.13-2.06-1.58-1.73.72-.35 2.57h-3l-.35-2.57-1.72-.72-2.07 1.58-2.13-2.13 1.58-2.07-.72-1.72-2.57-.35v-3l2.57-.35.72-1.73-1.58-2.06 2.13-2.13 2.07 1.58 1.72-.72z'

export function SettingsIcon({ filled = false, className = 'h-6 w-6' }: IconProps) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={`${className} fill-current`}>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d={`${GEAR_PATH} M12 9.3a2.7 2.7 0 1 0 0 5.4 2.7 2.7 0 0 0 0-5.4z`}
        />
      </svg>
    )
  }
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`${className} fill-none stroke-current stroke-[1.5]`}
    >
      <path d={GEAR_PATH} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  )
}

export function CommunityIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`${className} fill-none stroke-current stroke-[1.5]`}
    >
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="7" r="4" />
      <path
        d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
