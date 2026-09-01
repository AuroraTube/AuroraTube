import type { QualityOption } from '../../shared/types'
import { codecRank } from '../../shared/videoCodec'
import type { InternalStreamEntry } from './internalEntry'
import { qualityLabel } from './label'
import { pickBestAudio } from './entry'
import { toPublicEntry } from './slim'

/** Muxed + video-only (paired with best audio) quality options. */
export function buildProgressiveOptions(
  muxed: InternalStreamEntry[],
  videoOnly: InternalStreamEntry[],
  audioTracks: InternalStreamEntry[],
): QualityOption[] {
  const options: QualityOption[] = []
  const audio = pickBestAudio(audioTracks)

  for (const m of muxed) {
    if (m.isM3u8 || m.mediaType === 'hls') continue
    options.push({
      id: `muxed:${m.formatId ?? m.url}`,
      label: qualityLabel(m, 'muxed'),
      height: m.height,
      isMuxed: true,
      isHls: false,
      video: toPublicEntry(m),
    })
  }

  const byHeight = new Map<number, InternalStreamEntry[]>()
  for (const v of videoOnly) {
    if (v.isM3u8 || v.mediaType === 'hls') continue
    const h = v.height ?? 0
    const list = byHeight.get(h) ?? []
    list.push(v)
    byHeight.set(h, list)
  }

  for (const height of [...byHeight.keys()].sort((a, b) => b - a)) {
    const preferred = pickPreferredVideo(byHeight.get(height) ?? [])
    if (!preferred) continue
    options.push({
      id: `vo:${preferred.formatId ?? preferred.url}`,
      label: qualityLabel(preferred, 'split'),
      height: preferred.height,
      isMuxed: false,
      isHls: false,
      video: toPublicEntry(preferred),
      audio: audio ? toPublicEntry(audio) : undefined,
    })
  }

  return options
}

function pickPreferredVideo(candidates: InternalStreamEntry[]): InternalStreamEntry | undefined {
  if (!candidates.length) return undefined
  return [...candidates].sort((a, b) => rankVideo(b) - rankVideo(a))[0]
}

/** AVC/MP4 over VP9/WebM over AV1; bitrate breaks ties within the same codec class. */
function rankVideo(e: InternalStreamEntry): number {
  return codecRank(e.vcodec, e.ext) + (e.bitrate ?? 0)
}
