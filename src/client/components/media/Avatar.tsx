import { SafeImage } from './SafeImage'
import { placeholderBg } from './constants'

export function Avatar({
  src,
  size = 'sm',
}: {
  src?: string
  size?: 'xs' | 'sm' | 'md'
}) {
  const dim =
    size === 'xs' ? 'h-5 w-5' : size === 'md' ? 'h-9 w-9' : 'h-6 w-6 sm:h-8 sm:w-8'
  const shell = `${dim} shrink-0 rounded-full ${placeholderBg}`

  return (
    <SafeImage
      src={src}
      className={`${dim} shrink-0 rounded-full object-cover ${placeholderBg}`}
      fallback={<div className={shell} aria-hidden />}
    />
  )
}
