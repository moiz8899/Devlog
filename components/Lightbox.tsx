'use client'

import { TouchEvent, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { CommentWithAuthor, PostWithAuthor } from '@/types'
import { timeAgo } from '@/lib/dates'
import CommentSection from './commentSection'
import ReactionButton from './ReactionButton'
import VideoPlayer from './VideoPlayer'
import { toast } from './Toast'

interface LightboxProps {
  post: PostWithAuthor
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
  onReaction: (postId: string, userId: string) => void
  onDelete: (postId: string) => void
  currentUserId?: string
}

export default function Lightbox({
  post,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  onReaction,
  onDelete,
  currentUserId,
}: LightboxProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  const hasReacted = Boolean(
    post.reactions?.some(r => r.userId === currentUserId)
  )
  const mediaItems = useMemo(() => {
    const urls = post.mediaUrls?.length ? post.mediaUrls : [post.mediaUrl]
    const types = post.mediaTypes?.length ? post.mediaTypes : [post.mediaType]
    return urls.map((url, index) => ({
      url,
      type: types[index] || post.mediaType,
    }))
  }, [post.mediaType, post.mediaTypes, post.mediaUrl, post.mediaUrls])
  const hasMediaCarousel = mediaItems.length > 1
  const activeMedia = mediaItems[activeMediaIndex] || mediaItems[0]

  useEffect(() => {
    setActiveMediaIndex(0)
    setShowDeleteConfirm(false)
  }, [post.id])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key === 'ArrowLeft') {
        if (hasMediaCarousel && activeMediaIndex > 0) {
          setActiveMediaIndex(prev => prev - 1)
          return
        }

        if (hasPrev) {
          onPrev()
        }
      }

      if (event.key === 'ArrowRight') {
        if (hasMediaCarousel && activeMediaIndex < mediaItems.length - 1) {
          setActiveMediaIndex(prev => prev + 1)
          return
        }

        if (hasNext) {
          onNext()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    activeMediaIndex,
    hasMediaCarousel,
    hasNext,
    hasPrev,
    mediaItems.length,
    onClose,
    onNext,
    onPrev,
  ])

  useEffect(() => {
    let cancelled = false

    const loadComments = async () => {
      setLoading(true)

      try {
        const res = await fetch(`/api/posts/${post.id}/comments`)
        const payload = await res.json().catch(() => null)

        if (!res.ok) {
          throw new Error(payload?.error || 'Failed to load comments')
        }

        if (!cancelled) {
          setComments(payload?.data || [])
        }
      } catch (error) {
        if (!cancelled) {
          setComments([])
          toast.error('Failed to load comments')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadComments()

    return () => {
      cancelled = true
    }
  }, [post.id])

  const handleReaction = async () => {
    if (!session) {
      return
    }

    try {
      const res = await fetch(`/api/posts/${post.id}/react`, {
        method: 'POST',
      })

      if (!res.ok) {
        throw new Error('Failed to react')
      }

      onReaction(post.id, session.user.id)
    } catch {
      toast.error('Failed to react')
    }
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/u/${post.author.username}?post=${post.id}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied')
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
      })
      const payload = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to delete post')
      }

      onDelete(post.id)
      onClose()
      toast.success('Post deleted')
    } catch {
      toast.error('Failed to delete post')
    }
  }

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!hasMediaCarousel) return
    setTouchStartX(event.changedTouches[0].clientX)
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (!hasMediaCarousel || touchStartX === null) return
    const deltaX = event.changedTouches[0].clientX - touchStartX
    const swipeThreshold = 40

    if (deltaX > swipeThreshold) {
      setActiveMediaIndex(prev => (prev > 0 ? prev - 1 : prev))
    } else if (deltaX < -swipeThreshold) {
      setActiveMediaIndex(prev => (prev < mediaItems.length - 1 ? prev + 1 : prev))
    }

    setTouchStartX(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex bg-bg/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {hasPrev && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onPrev()
          }}
          aria-label="Previous post"
          className="absolute left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/80 transition-colors hover:bg-surface lg:flex"
        >
          {'<'}
        </button>
      )}

      {hasNext && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onNext()
          }}
          aria-label="Next post"
          className="absolute right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/80 transition-colors hover:bg-surface lg:flex"
        >
          {'>'}
        </button>
      )}

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface/80 transition-colors hover:bg-surface"
      >
        x
      </button>

      <div
        className="flex min-h-0 flex-1 flex-col pt-14 lg:flex-row lg:pt-0"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex min-h-[42vh] flex-1 items-center justify-center bg-surface p-3 sm:min-h-[50vh] sm:p-4 lg:min-h-0 lg:p-8">
          <motion.div
            layoutId={`post-${post.id}`}
            className="relative flex h-full w-full items-center justify-center"
          >
            {activeMedia?.type === 'VIDEO' ? (
              <VideoPlayer src={activeMedia.url} poster={post.thumbUrl || undefined} />
            ) : activeMedia?.type === 'GIF' ? (
              <Image
                src={activeMedia.url}
                alt={post.title}
                width={1200}
                height={1200}
                unoptimized
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div
                className="relative flex h-full w-full items-center justify-center"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={`${post.id}-${activeMedia?.url || post.mediaUrl}`}
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0.6 }}
                    className="relative flex h-full w-full items-center justify-center"
                  >
                    <Image
                      src={activeMedia?.url || post.mediaUrl}
                      alt={post.title}
                      width={1200}
                      height={1200}
                      className="max-h-full max-w-full object-contain"
                      priority
                    />
                  </motion.div>
                </AnimatePresence>

                {hasMediaCarousel && (
                  <>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setActiveMediaIndex(prev => (prev > 0 ? prev - 1 : prev))
                      }}
                      disabled={activeMediaIndex === 0}
                      aria-label="Previous image"
                      className="absolute left-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-bg/70 text-sm transition hover:bg-bg/85 disabled:cursor-not-allowed disabled:opacity-40 lg:flex"
                    >
                      {'<'}
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setActiveMediaIndex(prev =>
                          prev < mediaItems.length - 1 ? prev + 1 : prev
                        )
                      }}
                      disabled={activeMediaIndex === mediaItems.length - 1}
                      aria-label="Next image"
                      className="absolute right-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-bg/70 text-sm transition hover:bg-bg/85 disabled:cursor-not-allowed disabled:opacity-40 lg:flex"
                    >
                      {'>'}
                    </button>
                    <div className="absolute right-3 top-3 rounded bg-bg/75 px-2 py-1 text-xs">
                      {activeMediaIndex + 1}/{mediaItems.length}
                    </div>
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-bg/60 px-2 py-1">
                      {mediaItems.map((item, index) => (
                        <button
                          key={`${item.url}-${index}`}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            setActiveMediaIndex(index)
                          }}
                          aria-label={`Go to image ${index + 1}`}
                          className={`h-2.5 w-2.5 rounded-full transition ${
                            index === activeMediaIndex ? 'bg-accent' : 'bg-text/45 hover:bg-text/70'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </div>

        <div className="flex h-[58vh] w-full flex-col border-border bg-surface lg:h-auto lg:w-[26rem] lg:border-l">
          <div className="border-b border-border p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <Link href={`/u/${post.author.username}`} className="group flex items-center gap-2">
                {post.author.avatar && (
                  <Image
                    src={post.author.avatar}
                    alt={post.author.username}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <div>
                  <div className="font-medium transition-colors group-hover:text-accent">
                    {post.author.username}
                  </div>
                  <div className="text-xs text-muted">{timeAgo(post.createdAt)}</div>
                </div>
              </Link>

              {currentUserId === post.authorId && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="ml-auto text-muted transition-colors hover:text-red"
                >
                  delete
                </button>
              )}
            </div>

            {showDeleteConfirm && (
              <div className="mt-3 rounded border border-red/20 bg-red/10 p-3">
                <p className="mb-2 text-sm">Delete this post?</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex-1 rounded bg-red px-3 py-1 text-sm text-bg hover:bg-red/90"
                  >
                    yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 rounded border border-border px-3 py-1 text-sm hover:bg-surface-2"
                  >
                    no
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="border-b border-border p-3 sm:p-4">
            <h2 className="mb-2 font-display text-2xl">{post.title}</h2>
            {post.caption && <p className="mb-3 text-sm text-muted">{post.caption}</p>}

            {post.tags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <Link
                    key={tag}
                    href={`/tags/${tag}`}
                    className="text-xs text-muted transition-colors hover:text-accent"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4">
              <ReactionButton
                hasReacted={hasReacted}
                count={post._count?.reactions || 0}
                onClick={handleReaction}
              />
              <span className="text-sm text-muted">comments {post._count?.comments || 0}</span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-muted transition-colors hover:text-text"
              >
                copy link
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <CommentSection
              postId={post.id}
              comments={comments}
              setComments={setComments}
              loading={loading}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
