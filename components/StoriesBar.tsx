'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'

const StoryComposer = dynamic(() => import('./StoryComposer'), { ssr: false })
const StoryViewer = dynamic(() => import('./StoryViewer'), { ssr: false })

type Story = {
  id: string
  mediaUrl: string
  mediaType: 'IMAGE' | 'GIF' | 'VIDEO'
  caption?: string | null
  seen?: boolean
  author: {
    id: string
    username: string
    name?: string | null
    avatar?: string | null
    image?: string | null
  }
}

type StoriesBarProps = {
  initialStories: Story[]
}

export default function StoriesBar({ initialStories }: StoriesBarProps) {
  const [stories, setStories] = useState(initialStories)
  const [openComposer, setOpenComposer] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const lastY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (Math.abs(y - lastY.current) <= 8) return
      if (y <= 8) setIsVisible(true)
      else setIsVisible(y < lastY.current)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const reloadStories = useCallback(async () => {
    const res = await fetch('/api/stories')
    const payload = await res.json().catch(() => null)
    if (res.ok && payload?.data) setStories(payload.data)
  }, [])

  const grouped = useMemo(() => {
    const map = new Map<string, Story>()
    for (const story of stories) {
      if (!map.has(story.author.id)) map.set(story.author.id, story)
    }
    return Array.from(map.values())
  }, [stories])

  const handleSeen = useCallback(async (storyId: string) => {
    setStories((prev) => prev.map((story) => (story.id === storyId ? { ...story, seen: true } : story)))
    await fetch(`/api/stories/${storyId}/view`, { method: 'POST' })
  }, [])

  return (
    <>
      <div className={`sticky top-16 z-40 border-b border-border bg-bg/95 backdrop-blur-xl transition-transform duration-200 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto flex max-w-5xl items-center gap-3 overflow-x-auto px-4 py-3">
          <button onClick={() => setOpenComposer(true)} className="flex shrink-0 flex-col items-center gap-1">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent text-xl">+</div>
            <span className="text-xs text-muted">your story</span>
          </button>
          {grouped.map((story, idx) => {
            const avatarSrc = story.author.avatar || story.author.image || '/default-avatar.png'
            return (
              <button key={story.id} onClick={() => setActiveIndex(idx)} className="flex shrink-0 flex-col items-center gap-1">
                <Image
                  src={avatarSrc}
                  alt={story.author.username}
                  width={64}
                  height={64}
                  unoptimized={avatarSrc.startsWith('http')}
                  className={`h-16 w-16 rounded-full border-2 object-cover ${story.seen ? 'border-border' : 'border-accent'}`}
                />
                <span className="max-w-[72px] truncate text-xs text-muted">{story.author.username}</span>
              </button>
            )
          })}
        </div>
      </div>

      <AnimatePresence>
        {openComposer && (
          <StoryComposer
            onClose={() => setOpenComposer(false)}
            onCreated={reloadStories}
          />
        )}
      </AnimatePresence>

      {activeIndex !== null && grouped[activeIndex] && (
        <StoryViewer
          stories={grouped}
          startIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
          onSeen={handleSeen}
        />
      )}
    </>
  )
}
