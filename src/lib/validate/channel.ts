import { validateOpaqueId } from './id'

/** UC… channel ids or handle-like path tokens from Invidious. */
export function validateChannelId(value: string): string {
  return validateOpaqueId(value, 'channelId')
}
