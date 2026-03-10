'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { User } from '@prisma/client'
import { toast } from './Toast'

interface NewMessageModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (conversationId: string) => void
}

export default function NewMessageModal({ isOpen, onClose, onSelect }: NewMessageModalProps) {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setSearch('')
      setUsers([])
    }
  }, [isOpen])

  useEffect(() => {
    const searchUsers = async () => {
      if (!search.trim()) {
        setUsers([])
        return
      }

      setLoading(true)
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(search)}`)
        const { data } = await res.json()
        setUsers(data)
      } catch (error) {
        console.error('Failed to search users:', error)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounce)
  }, [search])

  const handleSelect = async (user: User) => {
    setCreating(true)
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      if (!res.ok) throw new Error('Failed to create conversation')

      const { data: conversation } = await res.json()
      onSelect(conversation.id)
      onClose()
    } catch (error) {
      toast.error('Failed to start conversation')
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-md bg-surface border border-border rounded-lg shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-medium">new message</h2>
        </div>

        <div className="p-4">
          <input
            type="text"
            placeholder="search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
            className="w-full bg-surface-2 border border-border rounded px-3 py-2 focus:outline-none focus:border-accent"
          />
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted">searching...</div>
          ) : users.length > 0 ? (
            <div className="divide-y divide-border">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSelect(user)}
                  disabled={creating}
                  className="w-full flex items-center gap-3 p-4 hover:bg-surface-2 transition-colors disabled:opacity-50"
                >
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.username}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-surface-2 rounded-full flex items-center justify-center">
                      {user.username[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="text-left">
                    <div className="font-medium">{user.name || user.username}</div>
                    <div className="text-sm text-muted">@{user.username}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : search ? (
            <div className="p-4 text-center text-muted">no users found</div>
          ) : null}
        </div>

        <div className="p-4 border-t border-border">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-border rounded hover:bg-surface-2 transition-colors"
          >
            cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}