'use client'

import { Dispatch, SetStateAction, useState } from 'react'
import { useSession } from 'next-auth/react'
import { CommentWithAuthor } from '@/types'
import CommentItem from './commentItem'
import CommentInput from './commentInput'
import { motion, AnimatePresence } from 'framer-motion'

interface CommentSectionProps {
  postId: string
  comments: CommentWithAuthor[]
  setComments: Dispatch<SetStateAction<CommentWithAuthor[]>>
  loading: boolean
  currentUserId?: string
}

export default function CommentSection({
  postId,
  comments,
  setComments,
  loading,
  currentUserId,
}: CommentSectionProps) {
  const { data: session } = useSession()
  const [replyingTo, setReplyingTo] = useState<CommentWithAuthor | null>(null)

  const getCounts = (comment: CommentWithAuthor) => ({
    likes: comment._count?.likes || 0,
    replies: comment._count?.replies || 0,
  })

  const handleAddComment = async (body: string, parentId?: string) => {
    if (!session) return

    const optimisticComment: CommentWithAuthor = {
      id: `temp-${Date.now()}`,
      body,
      postId,
      authorId: session.user.id,
      parentId: parentId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        id: session.user.id,
        username: session.user.username || 'you',
        name: session.user.name || null,
        avatar: session.user.avatar || session.user.image || null,
      },
      likes: [],
      replies: [],
      _count: {
        likes: 0,
        replies: 0,
      },
    }

    setComments(prev => {
      if (parentId) {
        return prev.map(comment =>
          comment.id === parentId
            ? {
                ...comment,
                replies: [...(comment.replies || []), optimisticComment],
                _count: {
                  ...getCounts(comment),
                  replies: getCounts(comment).replies + 1,
                },
              }
            : comment
        )
      }

      return [optimisticComment, ...prev]
    })
    setReplyingTo(null)

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, parentId }),
      })

      if (!res.ok) throw new Error('Failed to add comment')

      const { data: newComment } = await res.json()

      setComments(prev =>
        prev.map(comment => {
          if (comment.id === optimisticComment.id) {
            return newComment
          }
          if (comment.replies?.some(reply => reply.id === optimisticComment.id)) {
            return {
              ...comment,
              replies: comment.replies.map(reply =>
                reply.id === optimisticComment.id ? newComment : reply
              ),
            }
          }
          return comment
        })
      )
    } catch (error) {
      console.error('Failed to add comment:', error)
      setComments(prev =>
        prev
          .filter(comment => comment.id !== optimisticComment.id)
          .map(comment => ({
            ...comment,
            replies: comment.replies?.filter(reply => reply.id !== optimisticComment.id),
            _count:
              parentId && comment.id === parentId
                ? {
                    ...getCounts(comment),
                    replies: Math.max(getCounts(comment).replies - 1, 0),
                  }
                : comment._count,
          }))
      )
    }
  }

  const handleLikeComment = async (commentId: string) => {
    if (!session) return

    const rollback = comments
    setComments(prev =>
      prev.map(comment => {
        if (comment.id === commentId) {
          const hasLiked = comment.likes.some(like => like.userId === session.user.id)
          return {
            ...comment,
            likes: hasLiked
              ? comment.likes.filter(like => like.userId !== session.user.id)
              : [...comment.likes, { userId: session.user.id }],
            _count: {
              ...getCounts(comment),
              likes: getCounts(comment).likes + (hasLiked ? -1 : 1),
            },
          }
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(reply => {
              if (reply.id === commentId) {
                const hasLiked = reply.likes.some(like => like.userId === session.user.id)
                return {
                  ...reply,
                  likes: hasLiked
                    ? reply.likes.filter(like => like.userId !== session.user.id)
                    : [...reply.likes, { userId: session.user.id }],
                  _count: {
                    ...getCounts(reply),
                    likes: getCounts(reply).likes + (hasLiked ? -1 : 1),
                  },
                }
              }
              return reply
            }),
          }
        }
        return comment
      })
    )

    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}/like`, {
        method: 'POST',
      })

      if (!res.ok) throw new Error('Failed to like comment')
    } catch (error) {
      console.error('Failed to like comment:', error)
      setComments(rollback)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!session) return

    const rollback = comments
    setComments(prev =>
      prev
        .filter(comment => comment.id !== commentId)
        .map(comment => ({
          ...comment,
          replies: comment.replies?.filter(reply => reply.id !== commentId),
        }))
    )

    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete comment')
    } catch (error) {
      console.error('Failed to delete comment:', error)
      setComments(rollback)
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map(index => (
          <div key={index} className="animate-pulse">
            <div className="flex items-start gap-2">
              <div className="h-8 w-8 rounded-full bg-surface-2" />
              <div className="flex-1">
                <div className="mb-2 h-4 w-24 rounded bg-surface-2" />
                <div className="h-3 w-full rounded bg-surface-2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const topLevelComments = comments.filter(comment => !comment.parentId)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Comments</h3>
          <span className="text-xs text-muted">{topLevelComments.length}</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {topLevelComments.map(comment => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CommentItem
                comment={comment}
                onReply={() => setReplyingTo(comment)}
                onLike={() => handleLikeComment(comment.id)}
                onDelete={() => handleDeleteComment(comment.id)}
                currentUserId={currentUserId}
                depth={0}
              />

              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-8 mt-2 space-y-2">
                  {comment.replies.map(reply => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      onLike={() => handleLikeComment(reply.id)}
                      onDelete={() => handleDeleteComment(reply.id)}
                      currentUserId={currentUserId}
                      depth={1}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {comments.length === 0 && (
          <div className="py-8 text-center text-muted">
            no comments yet. be the first to say something.
          </div>
        )}
      </div>

      {replyingTo && (
        <div className="flex items-center justify-between border-t border-border bg-surface-2 px-4 py-2">
          <span className="text-sm text-muted">replying to @{replyingTo.author.username}</span>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="text-muted transition-colors hover:text-text"
          >
            x
          </button>
        </div>
      )}

      <div className="shrink-0 border-t border-border bg-surface p-4">
        <CommentInput
          onSubmit={(body) => handleAddComment(body, replyingTo?.id)}
          placeholder={replyingTo ? 'write your reply...' : 'add a comment...'}
        />
      </div>
    </div>
  )
}
