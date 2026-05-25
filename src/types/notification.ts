export type NotificationType = 'order' | 'chat' | 'system' | 'promotion' | 'security'
export type NotificationChannel = 'sms' | 'wechat' | 'email' | 'push'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  content: string | null
  data: Record<string, unknown> | null
  is_read: boolean
  channels_sent: string[] | null
  created_at: string
}

export interface Circle {
  id: string
  name: string
  description: string | null
  cover_url: string | null
  creator_id: string
  member_count: number
  is_official: boolean
  created_at: string
}

export interface CircleMember {
  circle_id: string
  user_id: string
  role: 'member' | 'moderator' | 'owner'
  joined_at: string
}

export interface CircleWithMembership extends Circle {
  is_member?: boolean
  member_role?: 'member' | 'moderator' | 'owner' | null
}

export interface Report {
  id: string
  reporter_id: string
  target_type: 'product' | 'user' | 'message'
  target_id: string
  reason: 'fraud' | 'prohibited' | 'spam' | 'inappropriate' | 'other'
  description: string | null
  evidence: string[] | null
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
  resolution: string | null
  handled_by: string | null
  created_at: string
  resolved_at: string | null
}

export interface Banner {
  id: number
  title: string | null
  image_url: string
  link_url: string | null
  sort_order: number
  is_active: boolean
  start_at: string | null
  end_at: string | null
  created_at: string
}

export interface Location {
  id: number
  name: string
  code: string | null
  parent_id: number | null
  level: 'province' | 'city' | 'district'
  lat: number | null
  lng: number | null
  is_active: boolean
}
