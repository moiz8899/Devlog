'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

let toasts: Toast[] = []
let listeners: ((toasts: Toast[]) => void)[] = []
const DEFAULT_TOAST_DURATION = 2200

const emitChange = () => {
  listeners.forEach(listener => listener([...toasts]))
}

export const toast = {
  success: (message: string, options?: { duration?: number }) => {
    const id = Math.random().toString(36).substr(2, 9)
    toasts.push({ id, message, type: 'success', duration: options?.duration || DEFAULT_TOAST_DURATION })
    emitChange()
  },
  error: (message: string, options?: { duration?: number }) => {
    const id = Math.random().toString(36).substr(2, 9)
    toasts.push({ id, message, type: 'error', duration: options?.duration || DEFAULT_TOAST_DURATION })
    emitChange()
  },
  info: (message: string, options?: { duration?: number }) => {
    const id = Math.random().toString(36).substr(2, 9)
    toasts.push({ id, message, type: 'info', duration: options?.duration || DEFAULT_TOAST_DURATION })
    emitChange()
  },
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([])
  const [pausedToastIds, setPausedToastIds] = useState<string[]>([])

  useEffect(() => {
    listeners.push(setItems)
    return () => {
      listeners = listeners.filter(l => l !== setItems)
    }
  }, [])

  const remove = (id: string) => {
    toasts = toasts.filter(t => t.id !== id)
    emitChange()
  }

  useEffect(() => {
    const timers = items
      .filter(item => !pausedToastIds.includes(item.id))
      .map(item =>
        window.setTimeout(() => remove(item.id), item.duration ?? DEFAULT_TOAST_DURATION)
      )

    return () => {
      timers.forEach(timer => window.clearTimeout(timer))
    }
  }, [items, pausedToastIds])

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {items.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`p-4 rounded-lg shadow-lg max-w-sm ${
              toast.type === 'success' ? 'bg-accent text-bg' :
              toast.type === 'error' ? 'bg-red text-bg' :
              'bg-surface-2 text-text'
            }`}
            onMouseEnter={() => {
              setPausedToastIds(current => current.includes(toast.id) ? current : [...current, toast.id])
            }}
            onMouseLeave={() => {
              setPausedToastIds(current => current.filter(id => id !== toast.id))
            }}
          >
            <p className="text-sm">{toast.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
