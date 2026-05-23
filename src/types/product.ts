export interface Category {
  id: number
  name: string
  icon_url: string | null
  parent_id: number | null
  sort_order: number
  ai_keywords: string[]
  is_active: boolean
}

export interface Product {
  id: string
  seller_id: string
  category_id: number | null
  title: string
  description: string | null
  price: string
  original_price: string | null
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor'
  trade_method: 'offline' | 'escrow' | 'both'
  status: string
  city_id: number | null
  lat: number | null
  lng: number | null
  view_count: number
  fav_count: number
  is_merchant: boolean
  ai_generated: boolean
  expires_at: string | null
  created_at: string
  updated_at: string
  // 关联数据
  images?: ProductImage[]
  seller?: {
    id: string
    nickname: string
    avatar_url: string | null
    credit_score?: number
  }
  category?: Category
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  sort_order: number
  ai_tags: string[]
  is_cover: boolean
  hash: string | null
  created_at: string
}

export interface ProductSku {
  id: string
  product_id: string
  spec_name: string
  stock: number
  price_override: string | null
  is_active: boolean
}

export interface ProductAiAnalysis {
  id: string
  product_id: string
  category_guess: string | null
  brand_guess: string | null
  condition_guess: string | null
  defect_tags: string[]
  suggested_price: string | null
  price_range_low: string | null
  price_range_high: string | null
  title_suggestion: string | null
  description_suggestion: string | null
  risk_flags: string[]
  analyzed_at: string
}

export const CONDITION_LABELS: Record<string, string> = {
  new: '全新',
  like_new: '几乎全新',
  good: '成色较好',
  fair: '有使用痕迹',
  poor: '明显瑕疵',
}

export const TRADE_METHOD_LABELS: Record<string, string> = {
  offline: '仅自提',
  escrow: '仅担保',
  both: '均可',
}
