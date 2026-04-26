'use client'

import dynamic from 'next/dynamic'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useMessagesStore } from '@/lib/messages-store'
import UnreadBadge from './UnreadBadge'

const PostComposer = dynamic(() => import('./PostComposer'), { ssr: false })

export default function Nav() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [showComposer, setShowComposer] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [tagFilter, setTagFilter] = useState('')
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

    router.prefetch('/')
    router.prefetch('/messages')
    router.prefetch(`/u/${session.user.username}`)
  }, [router, session?.user?.username])

  if (!session) return null

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-3 sm:px-4">
          <Link href="/" prefetch className="flex items-center gap-1 group">
            <span className="text-xl font-medium">Devlog!</span>
            <span className="w-[2px] h-5 bg-accent animate-blink opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          <div className="mx-8 hidden max-w-md flex-1 md:block">
            <input
              type="text"
              placeholder="filter by tag..."
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm transition-colors focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/messages"
              prefetch
              className="relative rounded-lg p-2 transition-colors hover:bg-surface-2 max-sm:hidden"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.5 11.6667C17.5 12.1087 17.3244 12.5326 17.0118 12.8452C16.6993 13.1577 16.2754 13.3333 15.8333 13.3333H5.83333L2.5 16.6667V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H15.8333C16.2754 2.5 16.6993 2.67559 17.0118 2.98816C17.3244 3.30072 17.5 3.72464 17.5 4.16667V11.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {mounted && unreadCount > 0 && <UnreadBadge count={unreadCount} />}
            </Link>

            <button
              onClick={() => setShowComposer(true)}
              className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-bg transition-colors hover:bg-accent/90 sm:px-4"
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
                  prefetch
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

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/90 px-2 py-2 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-sm items-center justify-between">
          <Link
            href="/"
            prefetch
            className={`rounded-lg px-3 py-2 text-xs transition-colors ${
              pathname === '/' ? 'bg-surface-2 text-text' : 'text-muted hover:text-text'
            }`}
          >
            Home
          </Link>
          <Link
            href="/messages"
            prefetch
            className={`relative rounded-lg px-3 py-2 text-xs transition-colors ${
              pathname.startsWith('/messages') ? 'bg-surface-2 text-text' : 'text-muted hover:text-text'
            }`}
          >
            Messages
            {mounted && unreadCount > 0 && (
              <span className="ml-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-bg">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
          <Link
            href={`/u/${session.user.username}`}
            prefetch
            className={`rounded-lg px-3 py-2 text-xs transition-colors ${
              pathname.startsWith(`/u/${session.user.username}`) ? 'bg-surface-2 text-text' : 'text-muted hover:text-text'
            }`}
          >
            Profile
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {showComposer && (
          <PostComposer onClose={() => setShowComposer(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
