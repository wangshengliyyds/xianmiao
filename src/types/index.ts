export * from './user'
export * from './product'
export * from './order'
export * from './chat'
export * from './notification'

// Common API response types
export interface ApiResponse<T = unknown> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

export interface PaginationParams {
  page?: number
  page_size?: number
}
