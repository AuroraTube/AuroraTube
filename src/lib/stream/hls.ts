import type { QualityOption } from '../../shared/types'
import { asArray, asString, isRecord, type RecordLike } from '../parse'
import { toStreamEntry } from './entry'
import type { InternalStreamEntry } from './internalEntry'
import { qualityLabel } from './label'
import { toPublicEntry } from './slim'
import { isHlsVariantUrl, looksLikeHls } from './url'

/** Collect raw HLS rows from SiaTube payload (dedup deferred to buildHlsOptions). */
export function collectHlsEntries(root: RecordLike, streams: RecordLike): InternalStreamEntry[] {
  const out: InternalStreamEntry[] = []
  const m3u8 = isRecord(root.m3u8) ? root.m3u8 : {}

  for (const raw of asArray(m3u8.list)) {
    const entry = toStreamEntry(raw, 'hls')
    if (entry) out.push({ ...entry, mediaType: 'hls', isM3u8: true })
  }

  const byLang = isRecord(m3u8.byLanguage) ? m3u8.byLanguage : {}
  for (const value of Object.values(byLang)) {
    if (!isRecord(value)) continue
    for (const raw of asArray(value.streams ?? value.list)) {
      const entry = toStreamEntry(raw, 'hls')
      if (entry) out.push({ ...entry, mediaType: 'hls', isM3u8: true })
    }
  }

  for (const raw of [...asArray(streams.muxed), ...asArray(streams.videoOnly), ...asArray(streams.m3u8)]) {
    const item = isRecord(raw) ? raw : {}
    const url = asString(item.streamUrl ?? item.url) ?? ''
    if (!looksLikeHls(item, url)) continue
    const entry = toStreamEntry(raw, 'hls')
    if (entry) out.push({ ...entry, mediaType: 'hls', isM3u8: true })
  }

  return out
}

/**
 * Fixed-quality options from sourceKey=url (hls_playlist),
 * plus one adaptive option from unique hls_variant / manifest_url.
 */
export function buildHlsOptions(hlsEntries: InternalStreamEntry[]): QualityOption[] {
  const options: QualityOption[] = []

  const fixed = hlsEntries.filter((e) => {
    if (e.sourceKey === 'manifest_url' || isHlsVariantUrl(e.url)) return false
    return Boolean(e.formatId || e.height)
  })

  const byKey = new Map<string, InternalStreamEntry>()
  for (const e of fixed) {
    const key = e.formatId ?? `h${e.height ?? 0}`
    const prev = byKey.get(key)
    if (!prev || rankFixed(e) > rankFixed(prev)) byKey.set(key, e)
  }

  for (const e of byKey.values()) {
    options.push(toHlsOption(e, false))
  }

  const manifests = hlsEntries.filter(
    (e) => e.sourceKey === 'manifest_url' || isHlsVariantUrl(e.url),
  )
  const seen = new Set<string>()
  for (const m of manifests) {
    if (seen.has(m.url)) continue
    seen.add(m.url)
    options.push(toHlsOption(m, true, `hls-auto:${m.url}`))
    break
  }

  if (!options.length) {
    const urls = new Set<string>()
    for (const e of hlsEntries) {
      if (urls.has(e.url)) continue
      urls.add(e.url)
      options.push(
        toHlsOption(e, e.sourceKey === 'manifest_url', `hls:${e.formatId ?? e.url}`),
      )
    }
  }

  return options
}

function toHlsOption(
  e: InternalStreamEntry,
  adaptive: boolean,
  id?: string,
): QualityOption {
  const out: QualityOption = {
    id: id ?? `hls:${e.formatId ?? e.height ?? e.url}`,
    label: qualityLabel(e, adaptive ? 'hls-auto' : 'hls'),
    isMuxed: true,
    isHls: true,
    video: toPublicEntry({ ...e, isM3u8: true }),
  }
  if (e.height != null) out.height = e.height
  if (adaptive) out.isAdaptiveHls = true
  return out
}

function rankFixed(e: InternalStreamEntry): number {
  return (e.sourceKey === 'url' ? 10 : 0) + (e.bitrate ?? 0)
}
