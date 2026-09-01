/** Field names treated as image URLs when rewriting to same-origin media-proxy URLs. */

export const SCALAR_IMAGE_KEYS = new Set([
  'authorAvatar',
  'avatar',
  'banner',
  'thumbnail',
  'thumbnailUrl',
  'playlistThumbnail',
  'channelIcon',
  'channelAvatar',
  'authorThumbnail',
  'channelThumbnail',
])

export const IMAGE_ARRAY_KEYS = new Set([
  'thumbnails',
  'authorThumbnails',
  'videoThumbnails',
  'playlistThumbnails',
  'channelIcons',
  'authorThumbnailsList',
  'channelThumbnails',
])

export function isImageArrayKey(key: string): boolean {
  if (IMAGE_ARRAY_KEYS.has(key)) return true
  return /thumbnail/i.test(key) || /icons?$/i.test(key)
}
