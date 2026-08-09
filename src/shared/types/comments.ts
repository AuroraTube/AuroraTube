/** Comment domain types (normalized from SiaTube). */

export type CommentSort = 'top' | 'new'

export type CommentAuthor = {
  name: string
  avatar?: string
  verified?: boolean
  isCreator?: boolean
}

export type CommentItem = {
  commentId: string
  text: string
  publishedTime?: string
  author: CommentAuthor
  likeCount?: number
  likeText?: string
  replyCount?: number
  replyText?: string
}

export type CommentsResponse = {
  comments: CommentItem[]
  continuation?: string
  totalCount?: number
}
