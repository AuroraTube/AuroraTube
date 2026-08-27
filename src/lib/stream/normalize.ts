import type { StreamPayload } from '../../shared/types'
import { asArray, isRecord, mapDefined } from '../parse'
import { collectAudioTracks, toStreamEntry } from './entry'
import { collectHlsEntries } from './hls'
import { buildQualityOptions } from './qualities'
import { collectSubtitles } from './subtitles'

/**
 * Normalize raw SiaTube `/api/stream/:videoId` JSON.
 * HLS URLs stay absolute (client fetches googlevideo / manifests directly).
 * Subtitle URLs are rewritten to `/api/media-proxy` inside collectSubtitles.
 * id/title are intentionally omitted — use the watch API for metadata.
 */
export function normalizeStreamPayload(source: unknown): StreamPayload {
  const root = isRecord(source) ? source : {}
  const streams = isRecord(root.streams) ? root.streams : {}

  const muxed = mapDefined(asArray(streams.muxed), (r) => toStreamEntry(r, 'muxed'))
  const videoOnly = mapDefined(asArray(streams.videoOnly), (r) => toStreamEntry(r, 'video_only'))
  const audioTracks = collectAudioTracks(streams)
  const hlsEntries = collectHlsEntries(root, streams)
  const subtitles = collectSubtitles(root.subtitles)

  return {
    qualities: buildQualityOptions(muxed, videoOnly, audioTracks, hlsEntries),
    subtitles,
  }
}
