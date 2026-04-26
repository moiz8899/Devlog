'use client'

import { useState } from 'react'
import Image from 'next/image'
import { toast } from './Toast'

type ProfilePost = {
  id: string
  title: string
  caption?: string | null
  tags: string[]
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
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    caption: '',
    tags: [] as string[],
    tagInput: '',
  })

  const normalizeTag = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/^#/, '')
      .replace(/[^a-z0-9-\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

  const openEdit = (post: ProfilePost) => {
    setEditingPostId(post.id)
    setConfirmingId(null)
    setEditForm({
      title: post.title,
      caption: post.caption || '',
      tags: post.tags || [],
      tagInput: '',
    })
  }

  const closeEdit = () => {
    setEditingPostId(null)
    setEditForm({
      title: '',
      caption: '',
      tags: [],
      tagInput: '',
    })
  }

  const handleAddTag = () => {
    const normalized = normalizeTag(editForm.tagInput)
    if (!normalized || editForm.tags.length >= 10 || editForm.tags.includes(normalized)) {
      if (editForm.tagInput.trim() && !normalized) {
        toast.error('Tags can only use letters, numbers, and hyphens')
      }
      return
    }

    setEditForm(prev => ({
      ...prev,
      tags: [...prev.tags, normalized],
      tagInput: '',
    }))
  }

  const handleRemoveTag = (tag: string) => {
    setEditForm(prev => ({
      ...prev,
      tags: prev.tags.filter(item => item !== tag),
    }))
  }

  const handleSave = async () => {
    if (!editingPostId) return
    if (!editForm.title.trim()) {
      toast.error('Title is required')
      return
    }

    setSavingId(editingPostId)

    try {
      const res = await fetch(`/api/posts/${editingPostId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title.trim(),
          caption: editForm.caption.trim() || undefined,
          tags: editForm.tags,
        }),
      })

      const payload = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to update post')
      }

      setItems(prev =>
        prev.map(post =>
          post.id === editingPostId
            ? {
                ...post,
                title: editForm.title.trim(),
                caption: editForm.caption.trim() || null,
                tags: editForm.tags,
              }
            : post
        )
      )
      toast.success('Post updated')
      closeEdit()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update post')
    } finally {
      setSavingId(null)
    }
  }

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
                <div className="absolute right-2 top-2 flex items-center gap-1">
                  <button
                    onClick={() => openEdit(post)}
                    className="rounded-md border border-border bg-bg/80 px-2 py-1 text-xs text-muted transition-colors hover:text-text"
                  >
                    edit
                  </button>
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

      {isOwner && editingPostId && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-bg/80 p-4 backdrop-blur-sm sm:items-center"
          onClick={closeEdit}
        >
          <div
            className="my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-lg font-medium">edit post</h3>
              <button
                type="button"
                onClick={closeEdit}
                className="rounded border border-border px-3 py-1 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-text"
                aria-label="Close edit post dialog"
              >
                x
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto p-4">
              <div>
                <label className="mb-1 block text-sm text-muted">title *</label>
                <input
                  type="text"
                  maxLength={80}
                  value={editForm.title}
                  onChange={event => setEditForm(prev => ({ ...prev, title: event.target.value }))}
                  className="w-full rounded border border-border bg-surface-2 px-3 py-2 focus:border-accent focus:outline-none"
                />
                <div className="mt-1 text-right text-xs text-muted">
                  {editForm.title.length}/80
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted">caption</label>
                <textarea
                  maxLength={300}
                  value={editForm.caption}
                  onChange={event => setEditForm(prev => ({ ...prev, caption: event.target.value }))}
                  className="h-24 w-full resize-none rounded border border-border bg-surface-2 px-3 py-2 focus:border-accent focus:outline-none"
                />
                <div className="mt-1 text-right text-xs text-muted">
                  {editForm.caption.length}/300
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted">tags</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editForm.tagInput}
                    onChange={event => setEditForm(prev => ({ ...prev, tagInput: event.target.value }))}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        handleAddTag()
                      }
                    }}
                    className="flex-1 rounded border border-border bg-surface-2 px-3 py-2 focus:border-accent focus:outline-none"
                    placeholder="react, typescript, nextjs..."
                    disabled={editForm.tags.length >= 10}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    disabled={!editForm.tagInput.trim() || editForm.tags.length >= 10}
                    className="rounded border border-border bg-surface-2 px-4 py-2 transition-colors hover:bg-surface disabled:opacity-50"
                  >
                    add
                  </button>
                </div>

                {editForm.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {editForm.tags.map(tag => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 rounded border border-border bg-surface-2 px-2 py-1 text-sm"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-muted transition-colors hover:text-text"
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border p-4">
              <button
                type="button"
                onClick={closeEdit}
                className="rounded border border-border px-4 py-2 transition-colors hover:bg-surface-2"
              >
                cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={savingId === editingPostId || !editForm.title.trim()}
                className="rounded bg-accent px-4 py-2 text-bg transition-colors hover:bg-accent/90 disabled:opacity-50"
              >
                {savingId === editingPostId ? 'saving...' : 'save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
