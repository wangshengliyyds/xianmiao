'use client'

import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { ConversationWithDetails, MessageWithSender } from '@/types'

export function useConversations() {
  const queryClient = useQueryClient()
  const supabaseRef = useRef(createClient())

  const query = useQuery({
    queryKey: ['conversations'],
    queryFn: async (): Promise<ConversationWithDetails[]> => {
      const res = await fetch('/api/conversations')
      if (!res.ok) throw new Error('获取会话列表失败')
      const { data } = await res.json()
      return data
    },
    staleTime: 60 * 1000,
  })

  // Realtime 订阅：对话列表变化时刷新
  useEffect(() => {
    const supabase = supabaseRef.current
    const channel = supabase
      .channel('conversations-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversation_members' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return query
}

export function useMessages(conversationId: string, before?: string) {
  const queryClient = useQueryClient()
  const supabaseRef = useRef(createClient())

  const query = useQuery({
    queryKey: ['messages', conversationId, before],
    queryFn: async (): Promise<{ data: MessageWithSender[]; has_more: boolean }> => {
      const params = new URLSearchParams()
      if (before) params.set('before', before)
      params.set('limit', '50')

      const res = await fetch(`/api/conversations/${conversationId}/messages?${params}`)
      if (!res.ok) throw new Error('获取消息失败')
      return res.json()
    },
    enabled: !!conversationId && !before,
    staleTime: 60 * 1000,
  })

  // Realtime 订阅：收到新消息时实时更新
  useEffect(() => {
    if (!conversationId || before) return

    const supabase = supabaseRef.current
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // 收到新消息，刷新消息列表
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
          // 同时刷新对话列表（更新最后一条消息）
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
          // 刷新未读计数
          queryClient.invalidateQueries({ queryKey: ['unread-summary'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, before, queryClient])

  return query
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
      // Realtime 会自动处理更新，这里只刷新对话列表
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}
