import { create } from 'zustand'

interface Notification {
  id: string
  type: 'reaction' | 'comment' | 'reply' | 'message'
  read: boolean
  createdAt: Date
  user?: {
    id: string
    username: string
    name?: string | null
    avatar?: string | null
  }
  post?: {
    id: string
    title: string
  }
  comment?: string
  conversationId?: string
  message?: any
}

interface NotificationsStore {
  notifications: Notification[]
  unreadCount: number
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
}

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) => {
    const unreadCount = notifications.filter(n => !n.read).length
    set({ notifications, unreadCount })
  },

  addNotification: (notification) => {
    const notifications = [notification, ...get().notifications]
    const unreadCount = get().unreadCount + 1
    set({ notifications, unreadCount })
  },

  markAsRead: (id) => {
    const notifications = get().notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    )
    const unreadCount = notifications.filter(n => !n.read).length
    set({ notifications, unreadCount })
  },

  markAllAsRead: () => {
    const notifications = get().notifications.map(n => ({ ...n, read: true }))
    set({ notifications, unreadCount: 0 })
  },

  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 })
  },
}))