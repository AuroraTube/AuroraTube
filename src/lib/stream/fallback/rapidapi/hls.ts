import type { QualityOption } from '../../../../shared/types'
import { asString } from '../../../parse'
import type { InternalStreamEntry } from '../../internalEntry'
import { qualityLabel } from '../../label'
import { toPublicEntry } from '../../slim'
import { isHlsVariantUrl, isSafeMediaUrl } from '../../url'

/** Adaptive HLS master from `hlsManifestUrl` → official QualityOption. */
export function collectHlsQuality(raw: Record<string, unknown>): QualityOption | null {
  const url = asString(raw.hlsManifestUrl)
  if (!url || !isSafeMediaUrl(url)) return null

  const adaptive = isHlsVariantUrl(url) || /\/manifest\/hls_/i.test(url)
  const entry: InternalStreamEntry = {
    url,
    mediaType: 'hls',
    isM3u8: true,
    ext: 'm3u8',
    sourceKey: adaptive ? 'manifest_url' : 'url',
  }

  const out: QualityOption = {
    id: adaptive ? `hls-auto:${url}` : `hls:${url}`,
    label: qualityLabel(entry, adaptive ? 'hls-auto' : 'hls'),
    isMuxed: true,
    isHls: true,
    video: toPublicEntry(entry),
  }
  if (adaptive) out.isAdaptiveHls = true
  return out
}
