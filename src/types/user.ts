export type UserRole = 'buyer' | 'seller' | 'merchant' | 'admin'

export interface Profile {
  id: string
  nickname: string
  avatar_url: string | null
  phone: string | null
  email: string | null
  role: UserRole
  city_id: number | null
  credit_score: number
  is_verified: boolean
  is_banned: boolean
  created_at: string
  updated_at: string
}

export interface MerchantProfile {
  id: string
  user_id: string
  shop_name: string
  license_url: string | null
  deposit_amount: number
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  approved_at: string | null
  approved_by: string | null
  created_at: string
}

export interface Address {
  id: string
  user_id: string
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  is_default: boolean
  lat: number | null
  lng: number | null
  created_at: string
}

export interface UserRating {
  id: string
  order_id: string
  rater_id: string
  ratee_id: string
  score: number
  content: string | null
  created_at: string
}

export interface UserFollow {
  follower_id: string
  following_id: string
  created_at: string
}

export interface DeviceToken {
  id: string
  user_id: string
  token: string
  platform: 'ios' | 'android' | 'web'
  is_active: boolean
  updated_at: string
}
