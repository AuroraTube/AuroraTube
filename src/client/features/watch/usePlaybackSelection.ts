import { useEffect, useMemo, useState } from 'react'
import type { QualityOption, StreamPayload, StreamSubtitle } from '@shared/types'
import { pickPreferredQuality } from '@/lib/playback'


export type PlaybackSelection = {
  selectedQuality?: QualityOption
  qualities: QualityOption[]
  setSelectedQualityId: (id: string) => void
  subtitles: StreamSubtitle[]
  selectedSubtitle?: StreamSubtitle
  subtitlesEnabled: boolean
  setSubtitlesEnabled: (v: boolean) => void
  setSelectedSubtitleUrl: (url: string) => void
}

/** Playback selection is driven solely by the stream payload. */
export function usePlaybackSelection(stream: StreamPayload | null): PlaybackSelection {
  const [selectedQualityId, setSelectedQualityId] = useState('')
  const [selectedSubtitleUrl, setSelectedSubtitleUrl] = useState('')
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false)

  const qualities = stream?.qualities ?? []
  const subtitles: StreamSubtitle[] = useMemo(
    () => stream?.subtitles ?? [],
    [stream?.subtitles],
  )

  // Reset to preferred (muxed-first) whenever the stream payload changes.
  useEffect(() => {
    if (!stream) {
      setSelectedQualityId('')
      return
    }
    const preferred = pickPreferredQuality(stream.qualities)
    setSelectedQualityId(preferred?.id ?? '')
  }, [stream])

  useEffect(() => {
    setSelectedSubtitleUrl(subtitles[0]?.url ?? '')
    setSubtitlesEnabled(false)
  }, [subtitles])

  // Explicit user selection wins; otherwise always preferred (never qualities[0]).
  const selectedQuality: QualityOption | undefined =
    (selectedQualityId
      ? qualities.find((q) => q.id === selectedQualityId)
      : undefined) ?? pickPreferredQuality(qualities)

  const selectedSubtitle: StreamSubtitle | undefined =
    subtitles.find((t) => t.url === selectedSubtitleUrl) ?? subtitles[0]

  return {
    qualities,
    selectedQuality,
    subtitles,
    selectedSubtitle,
    subtitlesEnabled,
    setSelectedQualityId,
    setSelectedSubtitleUrl,
    setSubtitlesEnabled,
  }
}
