'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import GridItem from './GridItem'
import SkeletonGrid from './SkeletonGrid'
import { PostWithAuthor } from '@/types'
import { toast } from './Toast'

const Lightbox = dynamic(() => import('./Lightbox'))

interface FeedProps {
  initialPosts: PostWithAuthor[]
  initialCursor?: string | null
  tag?: string
}

export default function Feed({ initialPosts, initialCursor, tag }: FeedProps) {
  const { data: session } = useSession()
  const [posts, setPosts] = useState(initialPosts)
  const [cursor, setCursor] = useState(initialCursor)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(!!initialCursor)
  const [selectedPost, setSelectedPost] = useState<PostWithAuthor | null>(null)
  const [reactingPostId, setReactingPostId] = useState<string | null>(null)
  const shouldReduceMotion = useReducedMotion()
  const observerRef = useRef<IntersectionObserver>()
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !cursor) return

    setLoading(true)
    try {
      const url = new URL('/api/posts', window.location.origin)
      url.searchParams.set('cursor', cursor)
      url.searchParams.set('limit', '12')
      if (tag) url.searchParams.set('tag', tag)

      const res = await fetch(url)
      const { data, cursor: nextCursor } = await res.json()

      setPosts(prev => [...prev, ...data])
      setCursor(nextCursor)
      setHasMore(!!nextCursor)
    } catch (error) {
      console.error('Failed to load more posts:', error)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, cursor, tag])

  useEffect(() => {
    if (!loadMoreRef.current) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    observerRef.current.observe(loadMoreRef.current)

    return () => observerRef.current?.disconnect()
  }, [loadMore, hasMore, loading])

  const handleReaction = (postId: string, userId: string) => {
    setPosts(prev => {
      const nextPosts = prev.map(post => {
        if (post.id === postId) {
          const currentReactions = post.reactions || []
          const currentCounts = post._count || { reactions: 0, comments: 0 }
          const hasReacted = currentReactions.some(r => r.userId === userId)

          return {
            ...post,
            _count: {
              reactions: currentCounts.reactions + (hasReacted ? -1 : 1),
              comments: currentCounts.comments,
            },
            reactions: hasReacted
              ? currentReactions.filter(r => r.userId !== userId)
              : [...currentReactions, { userId } as any],
          }
        }
        return post
      })

      if (selectedPost?.id === postId) {
        const updated = nextPosts.find(post => post.id === postId)
        if (updated) {
          setSelectedPost(updated)
        }
      }

      return nextPosts
    })
  }

  const handleReactionClick = async (postId: string) => {
    if (!session?.user?.id || reactingPostId === postId) return

    setReactingPostId(postId)

    try {
      const res = await fetch(`/api/posts/${postId}/react`, {
        method: 'POST',
      })

      if (!res.ok) {
        throw new Error('Failed to react')
      }

      handleReaction(postId, session.user.id)
    } catch (error) {
      toast.error('Failed to react')
    } finally {
      setReactingPostId(null)
    }
  }

  const handleDelete = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId))
    if (selectedPost?.id === postId) {
      setSelectedPost(null)
    }
  }

  const handleAuthorFollowChange = (authorId: string, following: boolean) => {
    setPosts(prev => {
      const nextPosts = prev.map(post =>
        post.author.id === authorId
          ? {
              ...post,
              author: {
                ...post.author,
                isFollowedByCurrentUser: following,
              },
            }
          : post
      )

      if (selectedPost?.author.id === authorId) {
        const updatedSelectedPost = nextPosts.find(post => post.id === selectedPost.id)
        if (updatedSelectedPost) {
          setSelectedPost(updatedSelectedPost)
        }
      }

      return nextPosts
    })
  }

  return (
    <>
      <div className="mx-auto w-full max-w-3xl px-3 py-4 sm:px-4 sm:py-6">
        {posts.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted">
            No posts yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <AnimatePresence mode="popLayout">
              {posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
                  transition={{
                    duration: 0.18,
                    delay: shouldReduceMotion ? 0 : Math.min(i, 5) * 0.02,
                  }}
                  layoutId={`post-${post.id}`}
                >
                  <GridItem
                    post={post}
                    onClick={() => setSelectedPost(post)}
                    onLike={() => handleReactionClick(post.id)}
                    onComment={() => setSelectedPost(post)}
                    onFollowChange={(following) => handleAuthorFollowChange(post.author.id, following)}
                    hasReacted={Boolean(
                      session?.user?.id &&
                        post.reactions?.some(r => r.userId === session.user.id)
                    )}
                    reacting={reactingPostId === post.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {loading && <SkeletonGrid />}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedPost && (
          <Lightbox
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            onPrev={() => {
              const index = posts.findIndex(p => p.id === selectedPost.id)
              if (index > 0) setSelectedPost(posts[index - 1])
            }}
            onNext={() => {
              const index = posts.findIndex(p => p.id === selectedPost.id)
              if (index < posts.length - 1) setSelectedPost(posts[index + 1])
            }}
            hasPrev={posts.findIndex(p => p.id === selectedPost.id) > 0}
            hasNext={posts.findIndex(p => p.id === selectedPost.id) < posts.length - 1}
            onReaction={handleReaction}
            onDelete={handleDelete}
            currentUserId={session?.user?.id}
          />
        )}
      </AnimatePresence>
    </>
  )
}
