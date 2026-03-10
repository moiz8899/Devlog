'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface UnreadBadgeProps {
  count: number
}

export default function UnreadBadge({ count }: UnreadBadgeProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red text-bg text-xs font-medium rounded-full px-1"
        >
          {count > 99 ? '99+' : count}
        </motion.div>
      )}
    </AnimatePresence>
  )
}