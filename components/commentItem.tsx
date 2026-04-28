'use client'

import Image from 'next/image'
import Link from 'next/link'
import { CommentWithAuthor } from '@/types'
import { timeAgo } from '@/lib/dates'
import { useState } from 'react'

interface CommentItemProps {
  comment: CommentWithAuthor
  onReply?: () => void
  onLike: () => void
  onDelete: () => void
  currentUserId?: string
  depth: number
}

export default function CommentItem({
  comment,
  onReply,
  onLike,
  onDelete,
  currentUserId,
  depth,
}: CommentItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const hasLiked = comment.likes.some(l => l.userId === currentUserId)
  const isAuthor = currentUserId === comment.authorId

  return (
    <div className={`group ${depth > 0 ? 'border-l border-border pl-3' : ''}`}>
      <div className="flex items-start gap-2">
        <Link href={`/u/${comment.author.username}`} prefetch className="shrink-0">
          {comment.author.avatar ? (
            <Image
              src={comment.author.avatar}
              alt={comment.author.username}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-surface-2 rounded-full" />
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/u/${comment.author.username}`}
              prefetch
              className="text-sm font-medium hover:text-accent transition-colors"
            >
              {comment.author.username}
            </Link>
            <span className="text-xs text-muted">{timeAgo(comment.createdAt)}</span>
          </div>

          <p className="mt-1 break-words text-sm leading-6">{comment.body}</p>

          <div className="mt-2 flex items-center gap-4">
            <button
              onClick={onLike}
              className={`text-xs flex items-center gap-1 transition-colors ${
                hasLiked ? 'text-red' : 'text-muted hover:text-text'
              }`}
            >
              ❤️ {comment._count?.likes || 0}
            </button>

            {depth === 0 && onReply && (
              <button
                onClick={onReply}
                className="text-xs text-muted hover:text-text transition-colors"
              >
                reply
              </button>
            )}

            {isAuthor && (
              <>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">delete?</span>
                    <button
                      onClick={onDelete}
                      className="text-xs text-red hover:text-red/80"
                    >
                      yes
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="text-xs text-muted hover:text-text"
                    >
                      no
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-xs text-muted hover:text-red transition-colors"
                  >
                    delete
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
