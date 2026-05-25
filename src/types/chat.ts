export type ConversationType = 'private' | 'group' | 'system'
export type MessageType = 'text' | 'image' | 'voice' | 'product_card' | 'offer' | 'order_push' | 'system'
export type MemberRole = 'member' | 'admin'

export interface Conversation {
  id: string
  type: ConversationType
  title: string | null
  avatar_url: string | null
  last_message_at: string | null
  created_at: string
}

export interface ConversationMember {
  conversation_id: string
  user_id: string
  role: MemberRole
  nickname: string | null
  is_muted: boolean
  unread_count: number
  joined_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  type: MessageType
  content: string | null
  metadata: Record<string, unknown> | null
  is_withdrawn: boolean
  created_at: string
}

export interface MessageRead {
  message_id: string
  user_id: string
  read_at: string
}

export interface ConversationWithDetails extends Conversation {
  members?: ConversationMember[]
  last_message?: Message | null
  unread_count?: number
  other_user?: {
    id: string
    nickname: string
    avatar_url: string | null
  }
}

export interface MessageWithSender extends Message {
  sender?: {
    id: string
    nickname: string
    avatar_url: string | null
  }
}
