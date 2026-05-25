'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ConversationWithDetails, MessageWithSender } from '@/types'

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async (): Promise<ConversationWithDetails[]> => {
      const res = await fetch('/api/conversations')
      if (!res.ok) throw new Error('获取会话列表失败')
      const { data } = await res.json()
      return data
    },
    staleTime: 30 * 1000,
    refetchInterval: 30000, // 每30秒刷新一次
  })
}

export function useMessages(conversationId: string, before?: string) {
  return useQuery({
    queryKey: ['messages', conversationId, before],
    queryFn: async (): Promise<{ data: MessageWithSender[]; has_more: boolean }> => {
      const params = new URLSearchParams()
      if (before) params.set('before', before)
      params.set('limit', '50')

      const res = await fetch(`/api/conversations/${conversationId}/messages?${params}`)
      if (!res.ok) throw new Error('获取消息失败')
      return res.json()
    },
    enabled: !!conversationId,
    staleTime: 10 * 1000,
    refetchInterval: 10000, // 每10秒刷新一次
  })
}

export function useCreateConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ targetUserId, productId }: { targetUserId: string; productId?: string }) => {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_user_id: targetUserId, product_id: productId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '创建会话失败')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      conversationId,
      type,
      content,
      metadata,
    }: {
      conversationId: string
      type: string
      content: string
      metadata?: Record<string, unknown>
    }) => {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content, metadata }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '发送消息失败')
      }
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}
