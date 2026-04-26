'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { toast } from './Toast'
import { timeAgo } from '@/lib/dates'

type StoryItem = {
  id: string
  mediaUrl: string
  mediaType: 'IMAGE' | 'GIF' | 'VIDEO'
  caption?: string | null
  viewCount?: number
  viewers?: Array<{
    id: string
    username: string
    name?: string | null
    avatar?: string | null
    image?: string | null
    viewedAt: string | Date
  }>
  author: { id: string; username: string; name?: string | null; avatar?: string | null; image?: string | null }
}

type StoryViewerProps = {
  stories: StoryItem[]
  startIndex: number
  onClose: () => void
  onSeen: (storyId: string) => void
}

export default function StoryViewer({ stories, startIndex, onClose, onSeen }: StoryViewerProps) {
  const { data: session } = useSession()
  const [index, setIndex] = useState(startIndex)
  const [reply, setReply] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [showViewers, setShowViewers] = useState(false)
  const replyInputRef = useRef<HTMLInputElement>(null)
  const active = stories[index]
  const isOwnStory = active?.author.id === session?.user?.id

  useEffect(() => {
    setShowViewers(false)
  }, [active?.id])

  useEffect(() => {
    if (!active) return
    onSeen(active.id)
    if (active.mediaType === 'VIDEO') return
    const timeout = window.setTimeout(() => {
      setIndex((prev) => (prev < stories.length - 1 ? prev + 1 : prev))
    }, 5000)
    return () => window.clearTimeout(timeout)
  }, [active, onSeen, stories.length])

  useEffect(() => {
    if (index >= stories.length) onClose()
  }, [index, stories.length, onClose])

  const avatarSrc = useMemo(
    () => active?.author.avatar || active?.author.image || '/default-avatar.png',
    [active]
  )

  if (!active) return null

  const handleReply = async () => {
    if (!active || !reply.trim() || sendingReply || isOwnStory) return

    setSendingReply(true)
    const clientTempId = `story-reply-${Date.now()}`

    try {
      const res = await fetch(`/api/stories/${active.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: reply.trim(),
          clientTempId,
        }),
      })

      const payload = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to send story reply')
      }

      setReply('')
      toast.success('Reply sent')
      replyInputRef.current?.blur()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send story reply')
    } finally {
      setSendingReply(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <button onClick={onClose} className="absolute right-4 top-4 rounded bg-white/20 px-3 py-1 text-white">close</button>
        <button onClick={() => setIndex((i) => Math.max(0, i - 1))} className="absolute left-4 rounded bg-white/20 px-3 py-1 text-white">prev</button>
        <button onClick={() => setIndex((i) => Math.min(stories.length - 1, i + 1))} className="absolute right-4 top-1/2 rounded bg-white/20 px-3 py-1 text-white">next</button>

        <div className="w-full max-w-md overflow-hidden rounded-xl bg-black">
          {active.mediaType === 'VIDEO' ? (
            <video src={active.mediaUrl} className="h-[70vh] w-full object-contain" controls autoPlay />
          ) : (
            <Image
              src={active.mediaUrl}
              alt="Story"
              width={720}
              height={1240}
              unoptimized
              className="h-[70vh] w-full object-contain"
            />
          )}
          <div className="flex items-center gap-2 p-3 text-white">
            <Image
              src={avatarSrc}
              alt={active.author.username}
              width={32}
              height={32}
              unoptimized={avatarSrc.startsWith('http')}
              className="h-8 w-8 rounded-full object-cover"
            />
            <div className="text-sm font-medium">{active.author.name || active.author.username}</div>
          </div>
          {active.caption && <div className="px-3 pb-3 text-sm text-white/90">{active.caption}</div>}
          {isOwnStory ? (
            <div className="border-t border-white/10 p-3">
              <button
                type="button"
                onClick={() => setShowViewers((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition-colors hover:bg-white/10"
              >
                <div>
                  <p className="text-sm font-medium">seen by</p>
                  <p className="text-xs text-white/60">
                    {active.viewCount || 0} {(active.viewCount || 0) === 1 ? 'person' : 'people'}
                  </p>
                </div>
                <span className="text-sm text-white/70">{showViewers ? 'hide' : 'view'}</span>
              </button>

              {showViewers && (
                <div className="mt-3 max-h-48 overflow-y-auto rounded-2xl border border-white/10 bg-white/5">
                  {active.viewers && active.viewers.length > 0 ? (
                    active.viewers.map((viewer) => {
                      const viewerAvatar = viewer.avatar || viewer.image || '/default-avatar.png'
                      return (
                        <div key={`${viewer.id}-${viewer.viewedAt}`} className="flex items-center gap-3 border-b border-white/10 px-4 py-3 last:border-b-0">
                          <Image
                            src={viewerAvatar}
                            alt={viewer.username}
                            width={36}
                            height={36}
                            unoptimized={viewerAvatar.startsWith('http')}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">
                              {viewer.name || viewer.username}
                            </p>
                            <p className="truncate text-xs text-white/60">
                              @{viewer.username}
                            </p>
                          </div>
                          <span className="text-xs text-white/50">
                            {timeAgo(viewer.viewedAt)}
                          </span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="px-4 py-3 text-sm text-white/60">No viewers yet.</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="border-t border-white/10 p-3">
              <div className="flex items-center gap-2">
                <input
                  ref={replyInputRef}
                  type="text"
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      void handleReply()
                    }
                  }}
                  maxLength={1000}
                  placeholder="reply to story..."
                  className="flex-1 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => void handleReply()}
                  disabled={!reply.trim() || sendingReply}
                  className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-50"
                >
                  {sendingReply ? '...' : 'send'}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
