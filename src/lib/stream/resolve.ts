import type { StreamPayload } from '../../shared/types'
import { firstSuccessfulNullable } from '../cascade'
import { STREAM_PROVIDERS } from './providers'
import { resolvePayloadRedirects } from './resolveRedirect'
import { slimStreamPayload } from './slim'

/**
 * Playback cascade (see STREAM_PROVIDERS).
 *
 * Failure kinds:
 * - hard_not_found: provider returned null with hardNotFoundOnNull (e.g. SiaTube 404)
 * - soft_failure: null/undefined without hard flag, empty qualities, or thrown error
 * - unexpected: non-ApiException throws (still soft for cascade purposes)
 *
 * After a payload is chosen, progressive/HLS media URLs are resolved through
 * HTTPS redirects so the client plays the final location.
 * Response is slimmed to client-needed fields only.
 */
export async function resolveStreamPayload(videoId: string): Promise<StreamPayload> {
  const payload = await firstSuccessfulNullable<StreamPayload>(
    STREAM_PROVIDERS.map((provider) => ({
      name: provider.name,
      hardNotFoundOnNull: provider.hardNotFoundOnNull,
      run: () => provider.run(videoId),
    })),
    'Stream not found',
    { operation: 'stream', id: videoId },
    {
      accept: (value) => value.qualities.length > 0,
      events: {
        miss: 'stream.provider_miss',
        rejected: 'stream.provider_empty',
        failed: 'stream.provider_failed',
        allFailed: 'stream.all_failed',
      },
    },
  )

  const resolved = await resolvePayloadRedirects(payload)
  return slimStreamPayload(resolved)
}
