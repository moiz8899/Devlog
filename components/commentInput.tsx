'use client'

import { useState, useRef, useEffect } from 'react'

interface CommentInputProps {
  onSubmit: (body: string) => Promise<void>
  placeholder?: string
}

export default function CommentInput({ onSubmit, placeholder }: CommentInputProps) {
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
      <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={300}
          className="min-h-[42px] flex-1 resize-none rounded-2xl border border-border bg-surface-2 px-4 py-2 text-sm outline-none transition-colors focus:border-accent"
          rows={1}
        />
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!body.trim() || submitting}
          className="shrink-0 rounded-full px-2 py-2 text-sm font-medium text-accent transition-colors disabled:text-muted disabled:opacity-50"
        >
          {submitting ? '...' : 'post'}
        </button>
      </div>
      <div className="text-[11px] text-muted">{body.length}/300</div>
    </div>
  )
}
