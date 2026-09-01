import { asString, firstString } from '../../../parse'

/** itag / format_id / formatId → stable format id string. */
export function formatIdOf(item: Record<string, unknown>): string | undefined {
  const itag = item.itag
  if (typeof itag === 'number' && Number.isFinite(itag)) return String(itag)
  return asString(item.itag) ?? asString(item.format_id) ?? asString(item.formatId)
}

/** True when the RapidAPI body indicates a hard failure (not OK). */
export function isProviderError(raw: Record<string, unknown>): boolean {
  const status = asString(raw.status)?.toUpperCase()
  if (status === 'OK' || status === 'SUCCESS') return false

  const message = firstString(raw.message, raw.error, asString(raw.msg))
  if (!message) {
    return status != null
  }
  return /quota|exceeded|not found|unavailable|private|deleted|invalid|error/i.test(message)
}
