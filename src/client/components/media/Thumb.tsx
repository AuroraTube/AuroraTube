import { SafeImage } from './SafeImage'
import { placeholderBg } from './constants'

export function Thumb({
  src,
  alt,
  className,
}: {
  src?: string
  alt: string
  className?: string
}) {
  return (
    <SafeImage
      src={src}
      alt={alt}
      className={className}
      fallback={<div className={`${className ?? ''} ${placeholderBg}`.trim()} aria-hidden />}
    />
  )
}
