'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useChatStore } from '@/stores/chat-store'

interface UnreadSummary {
  chat_unread: number
  notification_unread: number
}

export function useUnread() {
  const query = useQuery<UnreadSummary>({
    queryKey: ['unread-summary'],
    queryFn: async () => {
      const res = await fetch('/api/unread-summary')
      if (!res.ok) return { chat_unread: 0, notification_unread: 0 }
      return res.json()
    },
    staleTime: 15 * 1000,
    refetchInterval: 15000,
  })

  // 同步 chat unread 到 chat store
  useEffect(() => {
    if (query.data) {
      useChatStore.getState().setTotalUnread(query.data.chat_unread)
    }
  }, [query.data])

  return query
}
