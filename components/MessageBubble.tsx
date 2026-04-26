'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MessageWithSender } from '@/types'
import { timeAgo } from '@/lib/dates'
import { useState } from 'react'

interface MessageBubbleProps {
  message: MessageWithSender
  isOwn: boolean
  showAvatar: boolean
  otherUser: {
    id: string
    username: string
    name?: string | null
    avatar?: string | null
  }
}

export default function MessageBubble({ message, isOwn, showAvatar, otherUser }: MessageBubbleProps) {
  const [showTimestamp, setShowTimestamp] = useState(false)
  const storyPreviewUrl = message.story?.mediaUrl || message.storyMediaUrl

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {showAvatar && !isOwn && (
          <Link href={`/u/${otherUser.username}`} className="shrink-0">
            {otherUser.avatar ? (
              <Image
                src={otherUser.avatar}
                alt={otherUser.username}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-surface-2 rounded-full flex items-center justify-center text-xs">
                {otherUser.username[0]?.toUpperCase()}
              </div>
            )}
          </Link>
        )}

        <div>
          {/* Message bubble */}
          <div
            onMouseEnter={() => setShowTimestamp(true)}
            onMouseLeave={() => setShowTimestamp(false)}
            className={`relative group px-4 py-2 ${
              isOwn
                ? 'bg-accent-dim text-text rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl'
                : 'bg-surface-2 text-text rounded-tl-2xl rounded-tr-2xl rounded-br-2xl'
            }`}
          >
            {storyPreviewUrl ? (
              <div className="mb-2 overflow-hidden rounded-2xl border border-border/60 bg-black/15">
                <div className="flex items-center gap-3 p-2">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
                    <Image
                      src={storyPreviewUrl}
                      alt="Story preview"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium">
                      {isOwn ? 'you replied to their story' : 'commented on your story'}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {message.body}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
            )}
            
            {/* Timestamp on hover */}
            {showTimestamp && (
              <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full -ml-2' : 'right-0 translate-x-full mr-2'}`}>
                <span className="text-xs text-muted whitespace-nowrap">
                  {timeAgo(message.createdAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
