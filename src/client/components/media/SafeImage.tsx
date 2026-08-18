import { useEffect, useState, type ReactNode } from 'react'

type Props = {
  src?: string
  alt?: string
  className?: string
  /** Shown when src is missing or load fails */
  fallback?: ReactNode
}

/** Image that collapses to fallback on error or empty src. */
export function SafeImage({ src, alt = '', className, fallback }: Props) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (!src || failed) {
    return <>{fallback ?? null}</>
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}
