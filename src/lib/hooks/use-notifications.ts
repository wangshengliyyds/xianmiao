'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Notification, PaginatedResponse } from '@/types'

export function useNotifications(type?: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['notifications', type, page, pageSize],
    queryFn: async (): Promise<PaginatedResponse<Notification> & { unread_count: number }> => {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('page_size', pageSize.toString())
      if (type) params.set('type', type)

      const res = await fetch(`/api/notifications?${params}`)
      if (!res.ok) throw new Error('获取通知列表失败')
      return res.json()
    },
    staleTime: 30 * 1000,
    refetchInterval: 30000, // 每30秒刷新一次
  })
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ ids, markAll }: { ids?: string[]; markAll?: boolean }) => {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, mark_all: markAll }),
      })
      if (!res.ok) throw new Error('标记已读失败')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
