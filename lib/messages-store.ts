import { create } from 'zustand'

interface MessagesStore {
  unreadCount: number
  conversations: Map<string, number>
  setUnreadCount: (count: number) => void
  incrementUnread: (conversationId: string) => void
  markConversationRead: (conversationId: string) => void
}

export const useMessagesStore = create<MessagesStore>((set, get) => ({
  unreadCount: 0,
  conversations: new Map(),
  
  setUnreadCount: (count) => set({ unreadCount: count }),
  
  incrementUnread: (conversationId) => {
    const conversations = new Map(get().conversations)
    const current = conversations.get(conversationId) || 0
    conversations.set(conversationId, current + 1)
    
    set({
      conversations,
      unreadCount: get().unreadCount + 1,
    })
  },
  
  markConversationRead: (conversationId) => {
    const conversations = new Map(get().conversations)
    const count = conversations.get(conversationId) || 0
    conversations.delete(conversationId)
    
    set({
      conversations,
      unreadCount: Math.max(0, get().unreadCount - count),
    })
  },
}))