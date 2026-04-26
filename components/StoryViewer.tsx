'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type StoryItem = {
  id: string
  mediaUrl: string
  mediaType: 'IMAGE' | 'GIF' | 'VIDEO'
  caption?: string | null
  author: { username: string; name?: string | null; avatar?: string | null; image?: string | null }
}

type StoryViewerProps = {
  stories: StoryItem[]
  startIndex: number
  onClose: () => void
  onSeen: (storyId: string) => void
}

export default function StoryViewer({ stories, startIndex, onClose, onSeen }: StoryViewerProps) {
  const [index, setIndex] = useState(startIndex)
  const active = stories[index]

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
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
