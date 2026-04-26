'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ConversationWithParticipants, MessageWithSender } from '@/types'
import { useMessagesStore } from '@/lib/messages-store'
import MessageBubble from './MessageBubble'

interface ConversationViewProps {
  conversation: ConversationWithParticipants
  currentUserId: string
}

type RealtimeMessage = MessageWithSender & {
  clientTempId?: string
}

export default function ConversationView({
  conversation,
  currentUserId,
}: ConversationViewProps) {
  const [messages, setMessages] = useState<RealtimeMessage[]>(conversation.messages ?? [])
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const shouldStickToBottomRef = useRef(true)
  const lastConversationIdRef = useRef(conversation.id)
  const { markConversationRead } = useMessagesStore()

  const currentParticipant = useMemo(
    () => conversation.participants.find(p => p.user.id === currentUserId)?.user,
    [conversation.participants, currentUserId]
  )
  const otherParticipant = useMemo(
    () => conversation.participants.find(p => p.user.id !== currentUserId)?.user,
    [conversation.participants, currentUserId]
  )

  useEffect(() => {
    setMessages(conversation.messages ?? [])
  }, [conversation.id, conversation.messages])

  useEffect(() => {
    markConversationRead(conversation.id)
  }, [conversation.id, markConversationRead])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const updateStickiness = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight
      shouldStickToBottomRef.current = distanceFromBottom < 80
    }

    updateStickiness()
    container.addEventListener('scroll', updateStickiness, { passive: true })
    return () => container.removeEventListener('scroll', updateStickiness)
  }, [])

  useEffect(() => {
    const changedConversation = lastConversationIdRef.current !== conversation.id
    const behavior = changedConversation ? 'auto' : 'smooth'

    if (changedConversation || shouldStickToBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior })
    }

    lastConversationIdRef.current = conversation.id
  }, [conversation.id, messages])

  useEffect(() => {
    const socket = (window as any).socket
    if (!socket) {
      const poll = window.setInterval(async () => {
        try {
          const res = await fetch(`/api/conversations/${conversation.id}/messages`, {
            cache: 'no-store',
          })
          if (!res.ok) return

          const { data } = await res.json()
          setMessages(prev => {
            const previousIds = prev.map(message => message.id).join(',')
            const nextIds = (data ?? []).map((message: RealtimeMessage) => message.id).join(',')
            return previousIds === nextIds ? prev : data
          })
        } catch (error) {
          console.error('Failed to refresh messages:', error)
        }
      }, 5000)

      return () => window.clearInterval(poll)
    }

    socket.emit('join_conversation', { conversationId: conversation.id })

    const handleNewMessage = (message: RealtimeMessage) => {
      if (message.conversationId !== conversation.id) {
        return
      }

      setMessages(prev => {
        const deduped = prev.filter(existing => {
          if (existing.id === message.id) {
            return false
          }

          return !(message.clientTempId && existing.id === message.clientTempId)
        })

        return [...deduped, message]
      })

      if (message.senderId !== currentUserId) {
        markConversationRead(conversation.id)
      }
    }

    const handleMessageRead = () => {
      // Reserved for read receipts.
    }

    socket.on('new_message', handleNewMessage)
    socket.on('message_read', handleMessageRead)

    return () => {
      socket.emit('leave_conversation', { conversationId: conversation.id })
      socket.off('new_message', handleNewMessage)
      socket.off('message_read', handleMessageRead)
    }
  }, [conversation.id, currentUserId, markConversationRead])

  const handleSend = async () => {
    if (!inputValue.trim() || sending || !otherParticipant || !currentParticipant) return

    setSending(true)
    shouldStickToBottomRef.current = true

    const messageBody = inputValue.trim()
    const clientTempId = `temp-${Date.now()}`

    const optimisticMessage: RealtimeMessage = {
      id: clientTempId,
      body: messageBody,
      createdAt: new Date(),
      updatedAt: new Date(),
      conversationId: conversation.id,
      senderId: currentUserId,
      recipientId: otherParticipant.id,
      sender: currentParticipant,
      recipient: {
        id: otherParticipant.id,
        username: otherParticipant.username,
        name: otherParticipant.name,
        avatar: otherParticipant.avatar,
      },
      clientTempId,
    }

    setMessages(prev => [...prev, optimisticMessage])
    setInputValue('')
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    try {
      const res = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: messageBody, clientTempId }),
      })

      if (!res.ok) throw new Error('Failed to send message')

      const { data: sentMessage } = await res.json()

      setMessages(prev => {
        const withoutOptimistic = prev.filter(m => m.id !== optimisticMessage.id)
        const alreadyPresent = withoutOptimistic.some(m => m.id === sentMessage.id)
        return alreadyPresent ? withoutOptimistic : [...withoutOptimistic, sentMessage]
      })
    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  if (!otherParticipant) return null

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <Link href={`/u/${otherParticipant.username}`} className="flex items-center gap-3 group">
          {otherParticipant.avatar ? (
            <Image
              src={otherParticipant.avatar}
              alt={otherParticipant.username}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-surface-2 rounded-full flex items-center justify-center">
              {otherParticipant.username[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-medium group-hover:text-accent transition-colors">
              {otherParticipant.name || otherParticipant.username}
            </div>
            <div className="text-xs text-muted">@{otherParticipant.username}</div>
          </div>
        </Link>
      </div>

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const showAvatar =
            index === 0 || messages[index - 1].senderId !== message.senderId

          return (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUserId}
              showAvatar={showAvatar}
              otherUser={otherParticipant}
            />
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="write a message..."
            maxLength={1000}
            rows={1}
            className="flex-1 bg-surface-2 border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent resize-none max-h-32"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
            className="px-4 py-2 bg-accent text-bg rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            send
          </button>
        </div>
        <div className="text-xs text-muted mt-2 text-right">
          {inputValue.length}/1000 · enter to send, shift+enter new line
        </div>
      </div>
    </div>
  )
}
