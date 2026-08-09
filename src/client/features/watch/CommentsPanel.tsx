import { useState } from 'react'
import { useIsLgUp } from '@/hooks/useMediaQuery'
import { CommentsPreview } from './CommentsPreview'
import { CommentsSection } from './CommentsSection'
import { MobileFullScreen } from './MobileFullScreen'

type Props = {
  videoId: string
}

/**
 * Comments area:
 * - lg+: full CommentsSection only (no hidden mobile fetch).
 * - <lg: CommentsPreview → optional full-screen CommentsSection.
 */
export function CommentsPanel({ videoId }: Props) {
  const isLgUp = useIsLgUp()
  const [expanded, setExpanded] = useState(false)

  if (isLgUp) {
    return <CommentsSection videoId={videoId} />
  }

  return (
    <>
      <CommentsPreview videoId={videoId} onExpand={() => setExpanded(true)} />
      <MobileFullScreen
        title="コメント"
        open={expanded}
        onClose={() => setExpanded(false)}
      >
        {/* Mount full list only while expanded to avoid duplicate fetches. */}
        {expanded ? <CommentsSection videoId={videoId} /> : null}
      </MobileFullScreen>
    </>
  )
}
