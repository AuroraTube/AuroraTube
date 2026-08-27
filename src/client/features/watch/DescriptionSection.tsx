import { useMemo, useState } from 'react'
import { useIsLgUp } from '@/hooks/useMediaQuery'
import { MobileFullScreen } from './MobileFullScreen'

type Props = {
  description: string
}

/** Rough threshold: ~3 lines of typical description text. */
const EXPAND_THRESHOLD = 120

/**
 * Video description:
 * - lg+: 3-line clamp + in-place expand when long.
 * - <lg: 3-line clamp + full-screen overlay when long.
 */
export function DescriptionSection({ description }: Props) {
  const isLgUp = useIsLgUp()
  const [expanded, setExpanded] = useState(false)
  const needsExpand = useMemo(
    () => description.replace(/\s+/g, ' ').trim().length > EXPAND_THRESHOLD,
    [description],
  )

  if (isLgUp) {
    return (
      <div className="rounded-xl border border-line bg-white p-4">
        <p
          className={[
            'whitespace-pre-wrap text-sm leading-relaxed text-ink',
            needsExpand && !expanded ? 'line-clamp-3' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {description}
        </p>
        {needsExpand ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 text-sm font-medium text-[#065fd4] hover:underline"
          >
            {expanded ? '閉じる' : 'もっと見る'}
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <>
      <div className="rounded-xl border border-line bg-white p-4">
        <p
          className={[
            'whitespace-pre-wrap text-sm leading-relaxed text-ink',
            needsExpand ? 'line-clamp-3' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {description}
        </p>
        {needsExpand ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-2 text-sm font-medium text-[#065fd4] hover:underline"
          >
            もっと見る
          </button>
        ) : null}
      </div>

      <MobileFullScreen title="概要" open={expanded} onClose={() => setExpanded(false)}>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{description}</p>
      </MobileFullScreen>
    </>
  )
}
