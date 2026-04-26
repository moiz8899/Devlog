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
        return prev.map(c =>
          c.id === parentId
            ? {
                ...c,
                replies: [...(c.replies || []), optimisticComment],
                _count: {
                  ...getCounts(c),
                  replies: getCounts(c).replies + 1,
                },
              }
            : c
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
        prev.map(c => {
          if (c.id === optimisticComment.id) {
            return newComment
          }
          if (c.replies?.some(r => r.id === optimisticComment.id)) {
            return {
              ...c,
              replies: c.replies.map(r => (r.id === optimisticComment.id ? newComment : r)),
            }
          }
          return c
        })
      )
    } catch (error) {
      console.error('Failed to add comment:', error)
      // Roll back optimistic comment.
      setComments(prev =>
        prev
          .filter(c => c.id !== optimisticComment.id)
          .map(c => ({
            ...c,
            replies: c.replies?.filter(r => r.id !== optimisticComment.id),
            _count:
              parentId && c.id === parentId
                ? {
                    ...getCounts(c),
                    replies: Math.max(getCounts(c).replies - 1, 0),
                  }
                : c._count,
          }))
      )
    }
  }

  const handleLikeComment = async (commentId: string) => {
    if (!session) return

    const rollback = comments
    setComments(prev =>
      prev.map(c => {
        if (c.id === commentId) {
          const hasLiked = c.likes.some(l => l.userId === session.user.id)
          return {
            ...c,
            likes: hasLiked
              ? c.likes.filter(l => l.userId !== session.user.id)
              : [...c.likes, { userId: session.user.id }],
            _count: {
              ...getCounts(c),
              likes: getCounts(c).likes + (hasLiked ? -1 : 1),
            },
          }
        }
        if (c.replies) {
          return {
            ...c,
            replies: c.replies.map(r => {
              if (r.id === commentId) {
                const hasLiked = r.likes.some(l => l.userId === session.user.id)
                return {
                  ...r,
                  likes: hasLiked
                    ? r.likes.filter(l => l.userId !== session.user.id)
                    : [...r.likes, { userId: session.user.id }],
                  _count: {
                    ...getCounts(r),
                    likes: getCounts(r).likes + (hasLiked ? -1 : 1),
                  },
                }
              }
              return r
            }),
          }
        }
        return c
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
        .filter(c => c.id !== commentId)
        .map(c => ({
          ...c,
          replies: c.replies?.filter(r => r.id !== commentId),
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
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 bg-surface-2 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-surface-2 rounded w-24 mb-2" />
                <div className="h-3 bg-surface-2 rounded w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const topLevelComments = comments.filter(c => !c.parentId)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
              
              {/* Replies */}
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
          <div className="text-center text-muted py-8">
            no comments yet. be the first to say something.
          </div>
        )}
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 border-t border-border bg-surface-2 flex items-center justify-between">
          <span className="text-sm text-muted">
            replying to @{replyingTo.author.username}
          </span>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-muted hover:text-text"
          >
            ✕
          </button>
        </div>
      )}

      {/* Comment input */}
      <div className="border-t border-border p-4">
        <CommentInput
          onSubmit={(body) => handleAddComment(body, replyingTo?.id)}
          placeholder={replyingTo ? 'write your reply...' : 'add a comment...'}
        />
      </div>
    </div>
  )
}
