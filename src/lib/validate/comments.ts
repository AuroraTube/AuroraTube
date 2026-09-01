import type { CommentSort } from '../../shared/types'
import { badRequest } from '../errors'

export function validateCommentSort(value: string | null): CommentSort {
  if (!value || value === 'top') return 'top'
  if (value === 'new') return 'new'
  throw badRequest('Invalid sort')
}
