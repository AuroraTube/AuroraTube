import { validateOpaqueId } from './id'

export function validatePlaylistId(value: string): string {
  return validateOpaqueId(value, 'playlistId')
}
