import { create } from 'zustand'

// 注意：useUnread hook 会调用 setTotalUnread 同步未读数

interface ChatState {
  totalUnread: number
  activeConversationId: string | null
  setTotalUnread: (count: number) => void
  setActiveConversation: (id: string | null) => void
  decrementUnread: (count?: number) => void
  resetUnread: () => void
}

export const useChatStore = create<ChatState>()((set) => ({
  totalUnread: 0,
  activeConversationId: null,

  setTotalUnread: (count) => set({ totalUnread: count }),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  decrementUnread: (count = 1) =>
    set((state) => ({
      totalUnread: Math.max(0, state.totalUnread - count),
    })),

  resetUnread: () => set({ totalUnread: 0 }),
}))
