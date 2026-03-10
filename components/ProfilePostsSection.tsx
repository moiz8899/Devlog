'use client'

import { useState } from 'react'
import Image from 'next/image'
import { toast } from './Toast'

type ProfilePost = {
  id: string
  title: string
  mediaUrl: string
  thumbUrl: string | null
  mediaType: 'IMAGE' | 'GIF' | 'VIDEO'
  _count: {
    reactions: number
    comments: number
  }
}

interface ProfilePostsSectionProps {
  posts: ProfilePost[]
  isOwner: boolean
}

export default function ProfilePostsSection({
  posts,
  isOwner,
}: ProfilePostsSectionProps) {
  const [items, setItems] = useState(posts)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (postId: string) => {
    setDeletingId(postId)

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      const payload = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to delete post')
      }

      setItems(prev => prev.filter(post => post.id !== postId))
      toast.success('Post deleted')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete post')
    } finally {
      setDeletingId(null)
      setConfirmingId(null)
    }
  }

  return (
    <section id="posts" className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium">Posts</h2>
        <span className="text-xs uppercase tracking-wide text-muted">Instagram-style grid</span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted">No posts yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {items.map(post => (
            <article
              key={post.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-surface-2"
            >
              {post.mediaType === 'VIDEO' ? (
                <video
                  src={post.thumbUrl || post.mediaUrl}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <Image
                  src={post.thumbUrl || post.mediaUrl}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover"
                />
              )}

              {isOwner && (
                <div className="absolute right-2 top-2">
                  {confirmingId === post.id ? (
                    <div className="flex items-center gap-1 rounded-md border border-border bg-bg/90 p-1 text-xs">
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={deletingId === post.id}
                        className="rounded px-2 py-1 text-red hover:bg-red/10 disabled:opacity-50"
                      >
                        {deletingId === post.id ? 'deleting' : 'yes'}
                      </button>
                      <button
                        onClick={() => setConfirmingId(null)}
                        disabled={deletingId === post.id}
                        className="rounded px-2 py-1 hover:bg-surface-2 disabled:opacity-50"
                      >
                        no
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmingId(post.id)}
                      className="rounded-md border border-border bg-bg/80 px-2 py-1 text-xs text-muted hover:text-red"
                    >
                      delete
                    </button>
                  )}
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg/90 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="line-clamp-1 text-sm font-medium">{post.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {post._count.reactions} reactions - {post._count.comments} comments
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
