/**
 * Rich stream entry used while normalizing / ranking formats.
 * Only a subset is projected into the public StreamEntry on the wire.
 */

type StreamMediaType = 'muxed' | 'video_only' | 'audio_only' | 'hls'

export type StreamLanguage = {
  code?: string | null
  name?: string | null
  isOriginal?: boolean
  isDubbed?: boolean
  isAutoDubbed?: boolean
  isDefault?: boolean
  isDrc?: boolean
}

export type InternalStreamEntry = {
  url: string
  mediaType: StreamMediaType
  formatId?: string
  formatNote?: string
  ext?: string
  width?: number
  height?: number
  fps?: number
  vcodec?: string
  acodec?: string
  bitrate?: number
  audioChannels?: number
  quality?: number
  language?: StreamLanguage
  isM3u8?: boolean
  /**
   * SiaTube HLS sourceKey:
   * - `url` → fixed-quality hls_playlist (itag-specific)
   * - `manifest_url` → adaptive hls_variant master
   */
  sourceKey?: string
}
