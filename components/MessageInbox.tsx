'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { ConversationWithParticipants, MessageWithSender } from '@/types'
import { timeAgo } from '@/lib/dates'
import { useMessagesStore } from '@/lib/messages-store'
import UnreadBadge from './UnreadBadge'
import SkeletonMessages from './SkeletonMessages'

const NewMessageModal = dynamic(() => import('./NewMessageModal'), { ssr: false })

interface MessageInboxProps {
  initialConversations: ConversationWithParticipants[]
  currentUserId: string
}

type RealtimeMessage = MessageWithSender & {
  clientTempId?: string
}

export default function MessageInbox({
  initialConversations,
  currentUserId,
}: MessageInboxProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [conversations, setConversations] = useState(initialConversations)
  const [loading, setLoading] = useState(false)
  const [showNewMessage, setShowNewMessage] = useState(false)
  const { incrementUnread, markConversationRead } = useMessagesStore()

  const loadConversations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/conversations', { cache: 'no-store' })
      const { data } = await res.json()
      setConversations(data)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setConversations(initialConversations)
  }, [initialConversations])

  useEffect(() => {
    const socket = (window as any).socket
    if (!socket) {
      const poll = window.setInterval(() => {
        void loadConversations()
      }, 12000)
      return () => window.clearInterval(poll)
    }

    const handleNewMessage = (message: RealtimeMessage) => {
      let foundConversation = false

      setConversations(prev => {
        const next = prev.map(conversation => {
          if (conversation.id !== message.conversationId) {
            return conversation
          }

          foundConversation = true

          const dedupedMessages = (conversation.messages ?? []).filter(existing => {
            if (existing.id === message.id) {
              return false
            }

            return !(message.clientTempId && existing.id === message.clientTempId)
          })

          return {
            ...conversation,
            messages: [message, ...dedupedMessages].slice(0, 1),
            updatedAt: message.createdAt,
          }
        })

        if (!foundConversation) {
          return prev
        }

        return next.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
      })

      if (!foundConversation) {
        void loadConversations()
        return
      }

      const isActiveConversation = pathname === `/messages/${message.conversationId}`
      if (message.senderId !== currentUserId && !isActiveConversation) {
        incrementUnread(message.conversationId)
      }
    }

    socket.on('new_message', handleNewMessage)
    return () => {
      socket.off('new_message', handleNewMessage)
    }
  }, [currentUserId, incrementUnread, loadConversations, pathname])

  const getOtherParticipant = (conversation: ConversationWithParticipants) => {
    return conversation.participants.find(p => p.user.id !== currentUserId)?.user
  }

  const getLastMessage = (conversation: ConversationWithParticipants) => {
    return conversation.messages?.[0]
  }

  const getUnreadCount = (conversation: ConversationWithParticipants) => {
    const participant = conversation.participants.find(p => p.user.id === currentUserId)
    const messages = conversation.messages ?? []
    if (!participant || !participant.lastReadAt) return messages.length

    return messages.filter(
      m =>
        m.senderId !== currentUserId &&
        new Date(m.createdAt) > new Date(participant.lastReadAt!)
    ).length
  }

  if (loading && conversations.length === 0) {
    return <SkeletonMessages />
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            prefetch
            className="rounded border border-border px-3 py-1 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-text"
          >
            home
          </Link>
          <h1 className="text-lg font-medium">messages</h1>
        </div>
        <button
          onClick={() => setShowNewMessage(true)}
          className="px-3 py-1 bg-accent text-bg rounded text-sm hover:bg-accent/90 transition-colors"
        >
          new message
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="text-center text-muted py-8">
            no conversations yet.
            <button
              onClick={() => setShowNewMessage(true)}
              className="block mx-auto mt-2 text-accent hover:underline"
            >
              start a conversation {'->'}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map(conversation => {
              const other = getOtherParticipant(conversation)
              if (!other) return null

              const lastMessage = getLastMessage(conversation)
              const unreadCount = getUnreadCount(conversation)
              const isActive = pathname === `/messages/${conversation.id}`

              return (
                <Link
                  key={conversation.id}
                  href={`/messages/${conversation.id}`}
                  onClick={() => markConversationRead(conversation.id)}
                  className={`flex items-center gap-3 p-4 hover:bg-surface-2 transition-colors ${
                    isActive ? 'bg-surface-2' : ''
                  }`}
                >
                  <div className="relative">
                    {other.avatar ? (
                      <Image
                        src={other.avatar}
                        alt={other.username}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-surface-2 rounded-full flex items-center justify-center text-lg">
                        {other.username[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-medium truncate">{other.name || other.username}</span>
                      {lastMessage && (
                        <span className="text-xs text-muted">{timeAgo(lastMessage.createdAt)}</span>
                      )}
                    </div>
                    {lastMessage && (
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-sm text-muted truncate max-w-[200px]">
                          {lastMessage.senderId === currentUserId ? 'you: ' : ''}
                          {lastMessage.body}
                        </p>
                        {unreadCount > 0 && <UnreadBadge count={unreadCount} />}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <NewMessageModal
        isOpen={showNewMessage}
        onClose={() => setShowNewMessage(false)}
        onSelect={(conversationId) => {
          router.push(`/messages/${conversationId}`)
        }}
      />
    </div>
  )
}
