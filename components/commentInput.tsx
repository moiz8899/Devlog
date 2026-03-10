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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="space-y-2">
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={300}
        className="w-full bg-transparent border-0 border-b border-border focus:border-accent outline-none resize-none py-2 text-sm transition-colors"
        rows={1}
      />
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted">
          {body.length}/300 · {submitting ? 'sending...' : 'enter to send, shift+enter new line'}
        </span>
        <button
          onClick={handleSubmit}
          disabled={!body.trim() || submitting}
          className="px-3 py-1 bg-accent text-bg rounded disabled:opacity-50 transition-opacity"
        >
          post
        </button>
      </div>
    </div>
  )
}