'use client'

import Image from 'next/image'
import Link from 'next/link'
import { memo, MouseEvent, TouchEvent, useEffect, useMemo, useState } from 'react'
import { timeAgo } from '@/lib/dates'
import { PostWithAuthor } from '@/types'

interface GridItemProps {
  post: PostWithAuthor
  onClick: () => void
  onLike: () => void
  onComment: () => void
  hasReacted: boolean
  reacting?: boolean
}

function GridItem({
  post,
  onClick,
  onLike,
  onComment,
  hasReacted,
  reacting = false,
}: GridItemProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  const mediaItems = useMemo(() => {
    const urls = post.mediaUrls?.length ? post.mediaUrls : [post.mediaUrl]
    const types = post.mediaTypes?.length ? post.mediaTypes : [post.mediaType]
    return urls.map((url, index) => ({
      url,
      type: types[index] || post.mediaType,
    }))
  }, [post.mediaType, post.mediaTypes, post.mediaUrl, post.mediaUrls])

  const hasCarousel = mediaItems.length > 1
  const activeItem = mediaItems[activeMediaIndex] || mediaItems[0]

  useEffect(() => {
    setActiveMediaIndex(0)
    setImageLoaded(false)
  }, [post.id])

  const showPreviousImage = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setImageLoaded(false)
    setActiveMediaIndex(prev => (prev > 0 ? prev - 1 : prev))
  }

  const showNextImage = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setImageLoaded(false)
    setActiveMediaIndex(prev =>
      prev < mediaItems.length - 1 ? prev + 1 : prev
    )
  }

  const handleTouchStart = (event: TouchEvent<HTMLButtonElement>) => {
    if (!hasCarousel) return
    setTouchStartX(event.changedTouches[0].clientX)
  }

  const handleTouchEnd = (event: TouchEvent<HTMLButtonElement>) => {
    if (!hasCarousel || touchStartX === null) return
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
    <article className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <button
        type="button"
        onClick={onClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative block aspect-square w-full overflow-hidden bg-surface-2"
      >
        {activeItem?.type === 'VIDEO' ? (
          <video
            src={activeItem.url}
            className="h-full w-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <Image
            src={activeItem?.url || post.mediaUrl}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            key={activeItem?.url || post.mediaUrl}
            className={`object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
          />
        )}

        {hasCarousel && (
          <>
            <button
              type="button"
              onClick={showPreviousImage}
              disabled={activeMediaIndex === 0}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-bg/70 text-sm text-text transition hover:bg-bg/85 disabled:cursor-not-allowed disabled:opacity-40 lg:flex"
            >
              {'<'}
            </button>
            <button
              type="button"
              onClick={showNextImage}
              disabled={activeMediaIndex === mediaItems.length - 1}
              aria-label="Next image"
              className="absolute right-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-bg/70 text-sm text-text transition hover:bg-bg/85 disabled:cursor-not-allowed disabled:opacity-40 lg:flex"
            >
              {'>'}
            </button>
            <div className="absolute right-2 top-2 rounded bg-bg/75 px-2 py-1 text-xs">
              {activeMediaIndex + 1}/{mediaItems.length}
            </div>
          </>
        )}

        {activeItem?.type === 'VIDEO' && post.duration && (
          <div className="absolute bottom-2 right-2 rounded bg-bg/80 px-2 py-1 text-xs font-mono">
            {Math.floor(post.duration / 60)}:{(post.duration % 60).toString().padStart(2, '0')}
          </div>
        )}
      </button>

      <div className="space-y-3 p-3">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/u/${post.author.username}`}
            prefetch
            className="flex items-center gap-2 hover:text-accent transition-colors"
          >
            {post.author.avatar ? (
              <Image
                src={post.author.avatar}
                alt={post.author.username}
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-xs">
                {post.author.username[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-sm">@{post.author.username}</span>
          </Link>
          <span className="text-xs text-muted">{timeAgo(post.createdAt)}</span>
        </div>

        <div className="space-y-1">
          <h3 className="line-clamp-2 text-sm font-medium">{post.title}</h3>
          {post.caption && (
            <p className="line-clamp-3 text-sm text-muted">{post.caption}</p>
          )}
        </div>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <Link
                key={tag}
                href={`/tags/${tag}`}
                prefetch
                className="text-xs text-muted hover:text-accent transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 text-sm">
          <button
            type="button"
            onClick={onLike}
            disabled={reacting}
            className={`transition-colors disabled:opacity-60 ${
              hasReacted ? 'text-accent' : 'text-muted hover:text-text'
            }`}
          >
            likes {post._count?.reactions || 0}
          </button>
          <button
            type="button"
            onClick={onComment}
            className="text-muted transition-colors hover:text-text"
          >
            comments {post._count?.comments || 0}
          </button>
        </div>
      </div>
    </article>
  )
}

export default memo(GridItem)
