'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const POPULAR_TAGS = [
  'react',
  'typescript',
  'nextjs',
  'python',
  'javascript',
  'tailwind',
  'node',
  'docker',
  'graphql',
  'vue',
  'angular',
  'rust',
  'go',
  'rails',
  'laravel',
]

interface TagFilterProps {
  className?: string
}

export default function TagFilter({ className = '' }: TagFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '')
  const [showAll, setShowAll] = useState(false)

  const displayedTags = showAll ? POPULAR_TAGS : POPULAR_TAGS.slice(0, 8)

  const handleTagClick = (tag: string) => {
    if (tag === selectedTag) {
      // Remove filter
      setSelectedTag('')
      router.push(pathname)
    } else {
      // Apply filter
      setSelectedTag(tag)
      router.push(`${pathname}?tag=${tag}`)
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <AnimatePresence>
        {displayedTags.map((tag) => (
          <motion.button
            key={tag}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => handleTagClick(tag)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              selectedTag === tag
                ? 'bg-accent text-bg border-accent'
                : 'border-border hover:border-accent hover:text-accent'
            }`}
          >
            #{tag}
          </motion.button>
        ))}
      </AnimatePresence>

      {POPULAR_TAGS.length > 8 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="px-3 py-1.5 text-sm text-muted hover:text-accent transition-colors"
        >
          {showAll ? 'show less' : `+${POPULAR_TAGS.length - 8} more`}
        </button>
      )}
    </div>
  )
}