'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useMessagesStore } from '@/lib/messages-store'
import PostComposer from './PostComposer'
import UnreadBadge from './UnreadBadge'

export default function Nav() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [showComposer, setShowComposer] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [tagFilter, setTagFilter] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const { unreadCount } = useMessagesStore()
  const [mounted, setMounted] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!session?.user?.username) return

    let cancelled = false

    const loadLatestAvatar = async () => {
      try {
        const res = await fetch(`/api/users/${session.user.username}`)
        if (!res.ok) return

        const payload = await res.json().catch(() => null)
        const latestAvatar =
          payload?.data?.avatar || payload?.data?.image || null

        if (!cancelled) {
          setAvatarUrl(latestAvatar)
        }
      } catch {
        // Keep current avatar fallback values
      }
    }

    loadLatestAvatar()

    return () => {
      cancelled = true
    }
  }, [session?.user?.username, pathname])

  if (!session) return null

  return (
    <>
      <nav className="fixed top-0 z-50 w-full bg-surface/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between h-16 px-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-1 group">
            <span className="text-xl font-medium">Devlog!</span>
            <span className="w-[2px] h-5 bg-accent animate-blink opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          {/* Tag filter - hidden on mobile */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <input
              type="text"
              placeholder="filter by tag..."
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/messages"
              className="relative p-2 hover:bg-surface-2 rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.5 11.6667C17.5 12.1087 17.3244 12.5326 17.0118 12.8452C16.6993 13.1577 16.2754 13.3333 15.8333 13.3333H5.83333L2.5 16.6667V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H15.8333C16.2754 2.5 16.6993 2.67559 17.0118 2.98816C17.3244 3.30072 17.5 3.72464 17.5 4.16667V11.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {mounted && unreadCount > 0 && <UnreadBadge count={unreadCount} />}
            </Link>

            <button
              onClick={() => setShowComposer(true)}
              className="px-4 py-1.5 bg-accent text-bg rounded text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              new post
            </button>

            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen(prev => !prev)}
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
                aria-label="Open profile menu"
                className="block w-8 h-8 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-accent transition-all"
              >
                <Image
                  src={
                    avatarUrl ||
                    session.user.avatar ||
                    session.user.image ||
                    '/default-avatar.png'
                  }
                  alt={session.user.name || ''}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </button>

              <div
                className={`absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg transition-all ${
                  isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
                }`}
              >
                <Link
                  href={`/u/${session.user.username}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-2 text-sm hover:bg-surface-2 transition-colors"
                >
                  profile
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false)
                    signOut()
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red hover:bg-surface-2 transition-colors"
                >
                  sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {showComposer && (
          <PostComposer onClose={() => setShowComposer(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
