'use client'

import { motion } from 'framer-motion'

interface ReactionButtonProps {
  hasReacted: boolean
  count: number
  onClick: () => void
}

export default function ReactionButton({ hasReacted, count, onClick }: ReactionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 group"
    >
      <motion.span
        whileTap={{ scale: 1.5 }}
        className={`transition-colors ${
          hasReacted ? 'text-accent' : 'text-muted group-hover:text-text'
        }`}
      >
        🔥
      </motion.span>
      <span className={`text-sm ${hasReacted ? 'text-accent' : 'text-muted'}`}>
        {count}
      </span>
    </button>
  )
}