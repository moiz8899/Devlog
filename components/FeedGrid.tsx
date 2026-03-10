'use client'

import { motion, AnimatePresence } from 'framer-motion'
import GridItem from './GridItem'
import { PostWithAuthor } from '@/types'

interface FeedGridProps {
  posts: PostWithAuthor[]
  onPostClick: (post: PostWithAuthor) => void
}

export default function FeedGrid({ posts, onPostClick }: FeedGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
      <AnimatePresence mode="popLayout">
        {posts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
            layoutId={`post-${post.id}`}
          >
            <GridItem
              post={post}
              onClick={() => onPostClick(post)}
              onLike={() => {}}
              onComment={() => onPostClick(post)}
              hasReacted={false}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
