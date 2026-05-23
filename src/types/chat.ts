export interface Conversation {
  id: string
  type: 'private' | 'group' | 'system'
  title: string | null
  avatar_url: string | null
  last_message_at: string | null
  created_at: string
  // 关联
  members?: ConversationMember[]
  last_message?: Message
  unread_count?: number
}

export interface ConversationMember {
  conversation_id: string
  user_id: string
  role: 'member' | 'admin'
  nickname: string | null
  is_muted: boolean
  unread_count: number
  joined_at: string
  profile?: {
    nickname: string
    avatar_url: string | null
  }
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  type: 'text' | 'image' | 'voice' | 'product_card' | 'offer' | 'order_push' | 'system'
  content: string | null
  metadata: Record<string, unknown> | null
  is_withdrawn: boolean
  created_at: string
  sender?: {
    nickname: string
    avatar_url: string | null
  }
}

export interface Notification {
  id: string
  user_id: string
  type: 'order' | 'chat' | 'system' | 'promotion' | 'security'
  title: string
  body: string | null
  data: Record<string, unknown> | null
  is_read: boolean
  created_at: string
}
