export type ProductCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor'
export type TradeMethod = 'offline' | 'escrow' | 'both'
export type ProductStatus = 'draft' | 'active' | 'reserved' | 'sold' | 'expired' | 'removed'

export interface Category {
  id: number
  name: string
  icon_url: string | null
  parent_id: number | null
  sort_order: number
  ai_keywords: string[] | null
  is_active: boolean
}

export interface Product {
  id: string
  seller_id: string
  category_id: number | null
  title: string
  description: string | null
  price: number
  original_price: number | null
  condition: ProductCondition
  trade_method: TradeMethod
  status: ProductStatus
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
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  sort_order: number
  ai_tags: string[] | null
  is_cover: boolean
  hash: string | null
  created_at: string
}

export interface ProductVideo {
  id: string
  product_id: string
  url: string
  thumbnail_url: string | null
  duration: number | null
  created_at: string
}

export interface ProductSku {
  id: string
  product_id: string
  spec_name: string
  stock: number
  price_override: number | null
  is_active: boolean
}

export interface ProductAiAnalysis {
  id: string
  product_id: string
  category_guess: string | null
  brand_guess: string | null
  condition_guess: string | null
  defect_tags: string[] | null
  suggested_price: number | null
  price_range_low: number | null
  price_range_high: number | null
  title_suggestion: string | null
  description_suggestion: string | null
  risk_flags: string[] | null
  analyzed_at: string
}

export interface ProductTag {
  id: number
  name: string
  type: 'system' | 'ai' | 'user'
  use_count: number
}

export interface Favorite {
  user_id: string
  product_id: string
  created_at: string
}

export interface ProductView {
  id: number
  product_id: string
  viewer_id: string | null
  source: 'search' | 'recommend' | 'share' | 'direct'
  viewed_at: string
}

export interface SearchHistory {
  id: number
  user_id: string | null
  query: string
  filters: Record<string, unknown> | null
  result_count: number | null
  searched_at: string
}

export interface ProductWithImages extends Product {
  images: ProductImage[]
  seller?: {
    id: string
    nickname: string
    avatar_url: string | null
  }
  skus?: ProductSku[]
  ai_analysis?: ProductAiAnalysis | null
}

export interface ProductFilters {
  category_id?: number
  min_price?: number
  max_price?: number
  condition?: ProductCondition
  trade_method?: TradeMethod
  city_id?: number
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular'
}
