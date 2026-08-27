import type { QualityOption } from '../../../../shared/types'
import { asArray, asNumber, asString, isRecord } from '../../../parse'
import { pickBestAudio } from '../../entry'
import type { InternalStreamEntry } from '../../internalEntry'
import { qualityLabel } from '../../label'
import { toPublicEntry } from '../../slim'
import { isSafeMediaUrl } from '../../url'
import { codecFromMime, guessExt, parseHeight } from '../mediaMeta'
import { formatIdOf } from './helpers'

/**
 * Split adaptiveFormats into video-only + audio tracks,
 * then pair each video with the best audio → QualityOption[].
 */
export function collectAdaptiveQualities(raw: Record<string, unknown>): QualityOption[] {
  const audioTracks: InternalStreamEntry[] = []
  const videoOnly: InternalStreamEntry[] = []

  for (const item of asArray(raw.adaptiveFormats)) {
    if (!isRecord(item)) continue
    const url = asString(item.url)
    if (!url || !isSafeMediaUrl(url)) continue

    const mime = (asString(item.mimeType) ?? asString(item.mime) ?? '').toLowerCase()
    const kind = classifyAdaptive(item, mime)

    if (kind === 'audio') {
      audioTracks.push({
        url,
        mediaType: 'audio_only',
        formatId: formatIdOf(item),
        formatNote: asString(item.audioQuality) ?? asString(item.quality),
        ext: guessExt(mime) ?? 'm4a',
        acodec: codecFromMime(mime, 'audio'),
        bitrate: asNumber(item.bitrate) ?? asNumber(item.averageBitrate),
        audioChannels: asNumber(item.audioChannels),
      })
      continue
    }

    if (kind === 'video') {
      const height =
        asNumber(item.height) ??
        parseHeight(asString(item.qualityLabel) ?? asString(item.quality))
      videoOnly.push({
        url,
        mediaType: 'video_only',
        formatId: formatIdOf(item),
        formatNote: asString(item.qualityLabel) ?? asString(item.quality),
        ext: guessExt(mime) ?? 'mp4',
        width: asNumber(item.width),
        height: height ?? undefined,
        fps: asNumber(item.fps),
        vcodec: codecFromMime(mime, 'video'),
        bitrate: asNumber(item.bitrate) ?? asNumber(item.averageBitrate),
      })
    }
  }

  const bestAudio = pickBestAudio(audioTracks)
  const out: QualityOption[] = []
  for (const v of videoOnly) {
    const q: QualityOption = {
      id: `vo:${v.formatId ?? v.url}`,
      label: qualityLabel(v, 'split'),
      isMuxed: false,
      isHls: false,
      video: toPublicEntry(v),
      audio: bestAudio ? toPublicEntry(bestAudio) : undefined,
    }
    if (v.height != null) q.height = v.height
    out.push(q)
  }
  return out
}

/** mimeType first; then dimensions vs audio-only fields. */
function classifyAdaptive(
  item: Record<string, unknown>,
  mime: string,
): 'video' | 'audio' | 'unknown' {
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('video/')) return 'video'

  const hasDims =
    asNumber(item.width) != null ||
    asNumber(item.height) != null ||
    Boolean(asString(item.qualityLabel)?.match(/\d+p/i))
  const hasAudioHints =
    Boolean(asString(item.audioQuality)) ||
    asNumber(item.audioSampleRate) != null ||
    asNumber(item.audioChannels) != null

  if (hasDims) return 'video'
  if (hasAudioHints) return 'audio'
  return 'unknown'
}
