import type { SearchType } from './types/search'

export const SEARCH_TYPES = ['all', 'video', 'channel', 'playlist'] as const satisfies readonly SearchType[]
