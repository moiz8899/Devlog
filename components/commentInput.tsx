'use client'

import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface CommentInputProps {
  onSubmit: (body: string) => Promise<void>
  placeholder?: string
}

export default function CommentInput({ onSubmit, placeholder }: CommentInputProps) {
  const { data: session } = useSession()
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const avatarSrc = session?.user?.avatar || session?.user?.image || null

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [body])

  const handleSubmit = async () => {
    if (!body.trim() || submitting) return

    setSubmitting(true)
    try {
      await onSubmit(body)
      setBody('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSubmit()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {avatarSrc ? (
          <Image
            src={avatarSrc}
            alt={session?.user?.username || 'You'}
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs text-muted">
            {session?.user?.username?.[0]?.toUpperCase() || 'Y'}
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={300}
          className="min-h-[40px] flex-1 resize-none rounded-full border border-border bg-surface-2 px-4 py-2 text-sm outline-none transition-colors focus:border-accent"
          rows={1}
        />
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!body.trim() || submitting}
          className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent/90 disabled:bg-surface-2 disabled:text-muted disabled:opacity-100"
        >
          {submitting ? '...' : 'Post'}
        </button>
      </div>
      {body.length > 0 && <div className="pl-11 text-[11px] text-muted">{body.length}/300</div>}
    </div>
  )
}
