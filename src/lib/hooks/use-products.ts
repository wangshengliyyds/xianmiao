'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ProductWithImages, ProductFilters, PaginatedResponse } from '@/types'

export function useProducts(filters: ProductFilters = {}, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['products', filters, page, pageSize],
    queryFn: async (): Promise<PaginatedResponse<ProductWithImages>> => {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('page_size', pageSize.toString())

      if (filters.category_id) params.set('category_id', filters.category_id.toString())
      if (filters.city_id) params.set('city_id', filters.city_id.toString())
      if (filters.min_price) params.set('min_price', filters.min_price.toString())
      if (filters.max_price) params.set('max_price', filters.max_price.toString())
      if (filters.condition) params.set('condition', filters.condition)
      if (filters.trade_method) params.set('trade_method', filters.trade_method)
      if (filters.sort) params.set('sort', filters.sort)

      const res = await fetch(`/api/products?${params}`)
      if (!res.ok) throw new Error('获取商品列表失败')
      return res.json()
    },
    staleTime: 30 * 1000,
  })
}

export function useSearchProducts(keyword: string, filters: ProductFilters = {}, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['products', 'search', keyword, filters, page, pageSize],
    queryFn: async (): Promise<PaginatedResponse<ProductWithImages>> => {
      const params = new URLSearchParams()
      params.set('q', keyword)
      params.set('page', page.toString())
      params.set('page_size', pageSize.toString())

      if (filters.category_id) params.set('category_id', filters.category_id.toString())
      if (filters.min_price) params.set('min_price', filters.min_price.toString())
      if (filters.max_price) params.set('max_price', filters.max_price.toString())
      if (filters.condition) params.set('condition', filters.condition)
      if (filters.sort) params.set('sort', filters.sort)

      const res = await fetch(`/api/products/search?${params}`)
      if (!res.ok) throw new Error('搜索商品失败')
      return res.json()
    },
    enabled: !!(keyword && keyword.trim()) || Object.keys(filters).some((k) => k !== 'sort' && filters[k as keyof ProductFilters]),
    staleTime: 30 * 1000,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '发布商品失败')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useFavorites(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['favorites', page, pageSize],
    queryFn: async () => {
      const res = await fetch(`/api/favorites?page=${page}&page_size=${pageSize}`)
      if (!res.ok) throw new Error('获取收藏列表失败')
      return res.json()
    },
    staleTime: 60 * 1000,
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ productId, isFavorited }: { productId: string; isFavorited: boolean }) => {
      if (isFavorited) {
        const res = await fetch(`/api/favorites?product_id=${productId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('取消收藏失败')
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: productId }),
        })
        if (!res.ok) throw new Error('收藏失败')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
