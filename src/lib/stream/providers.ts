/**
 * Ordered stream providers for the playback cascade.
 *
 * Return contract for `run`:
 * - StreamPayload with qualities → success
 * - null → miss (hard_not_found when hardNotFoundOnNull is true, else soft)
 * - undefined → soft miss
 * - throw → soft miss (classified via cascade.classifyThrownError)
 */
import type { StreamPayload } from '../../shared/types'
import { fetchGetlateStream, fetchRapidApiStream } from './fallback'
import { fetchSiaTubeStream } from './siatubeStream'

export type StreamProvider = {
  name: string
  run: (videoId: string) => Promise<StreamPayload | null | undefined>
  /** When true, a null result marks hard_not_found for the whole cascade. */
  hardNotFoundOnNull?: boolean
}

export const STREAM_PROVIDERS: readonly StreamProvider[] = [
  {
    name: 'siatube',
    hardNotFoundOnNull: true,
    run: (videoId) => fetchSiaTubeStream(videoId),
  },
  {
    name: 'rapidapi',
    run: (videoId) => fetchRapidApiStream(videoId),
  },
  {
    name: 'getlate',
    run: (videoId) => fetchGetlateStream(videoId),
  },
] as const
