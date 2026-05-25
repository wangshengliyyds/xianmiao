'use client'

import { useQuery } from '@tanstack/react-query'

interface UnreadSummary {
  chat_unread: number
  notification_unread: number
}

export function useUnread() {
  return useQuery<UnreadSummary>({
    queryKey: ['unread-summary'],
    queryFn: async () => {
      const res = await fetch('/api/unread-summary')
      if (!res.ok) return { chat_unread: 0, notification_unread: 0 }
      return res.json()
    },
    staleTime: 15 * 1000,
    refetchInterval: 15000,
  })
}
