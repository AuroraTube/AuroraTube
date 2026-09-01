import type { InternalStreamEntry, StreamLanguage } from './internalEntry'
import {
  asArray,
  asNumber,
  asString,
  firstString,
  isRecord,
  type RecordLike,
} from '../parse'
import { isSafeMediaUrl, looksLikeHls } from './url'

function toLanguage(raw: unknown): StreamLanguage | undefined {
  if (!isRecord(raw)) return undefined
  return {
    code: asString(raw.code) ?? null,
    name: asString(raw.name) ?? null,
    isOriginal: Boolean(raw.isOriginal),
    isDubbed: Boolean(raw.isDubbed),
    isAutoDubbed: Boolean(raw.isAutoDubbed),
    isDefault: Boolean(raw.isDefault),
    isDrc: Boolean(raw.isDrc),
  }
}

export function toStreamEntry(
  source: unknown,
  fallbackType: InternalStreamEntry['mediaType'],
): InternalStreamEntry | null {
  const item = isRecord(source) ? source : {}
  const url = asString(item.streamUrl ?? item.url)
  if (!url || !isSafeMediaUrl(url)) return null

  const mediaRaw = asString(item.mediaType)?.toLowerCase()
  let mediaType: InternalStreamEntry['mediaType'] = fallbackType
  if (looksLikeHls(item, url) || mediaRaw === 'hls' || mediaRaw === 'm3u8') {
    mediaType = 'hls'
  } else if (mediaRaw === 'muxed') mediaType = 'muxed'
  else if (mediaRaw === 'video_only' || mediaRaw === 'videoonly') mediaType = 'video_only'
  else if (mediaRaw === 'audio_only' || mediaRaw === 'audioonly') mediaType = 'audio_only'

  return {
    url,
    mediaType,
    formatId: asString(item.formatId),
    formatNote: firstString(item.formatNote, item.format),
    ext: asString(item.ext) ?? (mediaType === 'hls' ? 'm3u8' : undefined),
    width: asNumber(item.width),
    height: asNumber(item.height),
    fps: asNumber(item.fps),
    vcodec: asString(item.vcodec),
    acodec: asString(item.acodec),
    bitrate: asNumber(item.tbr) ?? asNumber(item.vbr) ?? asNumber(item.abr),
    audioChannels: asNumber(item.audioChannels),
    quality: asNumber(item.quality),
    language: toLanguage(item.language),
    isM3u8: mediaType === 'hls' || Boolean(item.isM3u8),
    sourceKey: asString(item.sourceKey),
  }
}

export function collectAudioTracks(streams: RecordLike): InternalStreamEntry[] {
  const out: InternalStreamEntry[] = []
  const byLang = isRecord(streams.audioByLanguage) ? streams.audioByLanguage : {}
  for (const value of Object.values(byLang)) {
    if (!isRecord(value)) continue
    for (const raw of asArray(value.streams)) {
      const entry = toStreamEntry(raw, 'audio_only')
      if (entry) out.push(entry)
    }
  }
  for (const raw of asArray(streams.audioOnly)) {
    const entry = toStreamEntry(raw, 'audio_only')
    if (entry) out.push(entry)
  }
  return out
}

/** Prefer higher bitrate, non-DRC, m4a/mp4a. */
export function pickBestAudio(tracks: InternalStreamEntry[]): InternalStreamEntry | undefined {
  if (!tracks.length) return undefined
  return [...tracks].sort((a, b) => scoreAudio(b) - scoreAudio(a))[0]
}

function scoreAudio(t: InternalStreamEntry): number {
  let s = t.bitrate ?? t.quality ?? 0
  const note = (t.formatNote ?? '').toLowerCase()
  const id = (t.formatId ?? '').toLowerCase()
  if (note.includes('drc') || id.includes('drc')) s -= 50
  if (t.ext === 'm4a' || t.acodec?.includes('mp4a')) s += 20
  return s
}
