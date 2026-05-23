'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { MOCK_CONVERSATIONS, MOCK_MESSAGES, MOCK_NOTIFICATIONS } from '@/lib/mock-data'
import type { Conversation, Message, Notification } from '@/types/chat'

// 获取会话列表
export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) return MOCK_CONVERSATIONS

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('conversation_members')
        .select(`
          conversation_id,
          unread_count,
          conversation:conversations(
            id, type, title, avatar_url, last_message_at, created_at,
            last_message:messages(id, type, content, sender_id, created_at, sender:profiles!sender_id(nickname, avatar_url))
          )
        `)
        .eq('user_id', user.id)
        .order('conversation(last_message_at)', { ascending: false })

      if (error) throw error

      return (data || []).map((item) => {
        const conv = item.conversation as unknown as Conversation
        return {
          ...conv,
          unread_count: item.unread_count,
        }
      }) as Conversation[]
    },
  })
}

// 获取单个会话的消息
export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!isSupabaseConfigured()) return MOCK_MESSAGES

      const supabase = createClient()
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(nickname, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .eq('is_withdrawn', false)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error
      return data as Message[]
    },
    enabled: !!conversationId,
  })
}

// 实时订阅消息
export function useMessagesRealtime(conversationId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!conversationId || !isSupabaseConfigured()) return

    const supabase = createClient()
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const { data: sender } = await supabase
            .from('profiles')
            .select('nickname, avatar_url')
            .eq('id', payload.new.sender_id)
            .single()

          const newMessage = {
            ...payload.new,
            sender,
          } as Message

          queryClient.setQueryData<Message[]>(
            ['messages', conversationId],
            (old) => (old ? [...old, newMessage] : [newMessage])
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, queryClient])
}

// 发送消息
export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      conversationId: string
      type: Message['type']
      content?: string
      metadata?: Record<string, unknown>
    }) => {
      if (!isSupabaseConfigured()) {
        return {
          id: `mock-msg-${Date.now()}`,
          conversation_id: params.conversationId,
          sender_id: 'mock-user-1',
          type: params.type,
          content: params.content || null,
          metadata: params.metadata || null,
          is_withdrawn: false,
          created_at: new Date().toISOString(),
          sender: { nickname: '我自己', avatar_url: null },
        } as Message
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('请先登录')

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: params.conversationId,
          sender_id: user.id,
          type: params.type,
          content: params.content || null,
          metadata: params.metadata || null,
        })
        .select()
        .single()

      if (error) throw error

      // 更新会话的 last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', params.conversationId)

      // 更新对方的未读数
      const { data: members } = await supabase
        .from('conversation_members')
        .select('user_id')
        .eq('conversation_id', params.conversationId)
        .neq('user_id', user.id)

      if (members) {
        for (const member of members) {
          await supabase
            .from('conversation_members')
            .update({ unread_count: supabase.rpc('increment') })
            .eq('conversation_id', params.conversationId)
            .eq('user_id', member.user_id)
        }
      }

      return data as Message
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

// 创建或获取私聊会话
export function useGetOrCreatePrivateConversation() {
  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!isSupabaseConfigured()) return 'mock-conv-new'

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('请先登录')

      // 查找是否已存在私聊
      const { data: existing } = await supabase
        .from('conversation_members')
        .select('conversation_id, conversation:conversations(id, type)')
        .eq('user_id', user.id)
        .eq('conversation.type', 'private')

      if (existing) {
        for (const item of existing) {
          const conv = item.conversation as unknown as { id: string; type: string }
          if (conv?.type === 'private') {
            const { data: otherMember } = await supabase
              .from('conversation_members')
              .select('user_id')
              .eq('conversation_id', item.conversation_id)
              .eq('user_id', targetUserId)
              .single()

            if (otherMember) {
              return item.conversation_id
            }
          }
        }
      }

      // 创建新会话
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({ type: 'private' })
        .select()
        .single()

      if (convError) throw convError

      await supabase.from('conversation_members').insert([
        { conversation_id: conv.id, user_id: user.id, role: 'member' },
        { conversation_id: conv.id, user_id: targetUserId, role: 'member' },
      ])

      return conv.id as string
    },
  })
}

// 标记会话已读
export function useMarkConversationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!isSupabaseConfigured()) return

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('conversation_members')
        .update({ unread_count: 0 })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

// 通知相关 hooks
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) return MOCK_NOTIFICATIONS

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data as Notification[]
    },
  })
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) return MOCK_NOTIFICATIONS.filter(n => !n.is_read).length

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return 0

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error
      return count || 0
    },
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id?: string) => {
      if (!isSupabaseConfigured()) return

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)

      if (id) {
        query = query.eq('id', id)
      } else {
        query = query.eq('is_read', false)
      }

      await query
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })
}
