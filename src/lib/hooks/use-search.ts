'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import type { Product } from '@/types/product'
import type { SearchFilters } from '@/components/search/filter-panel'

export function useSearch(query: string, filters: SearchFilters = {}) {
  return useQuery({
    queryKey: ['search', query, filters],
    queryFn: async () => {
      if (!query && !filters.categoryId) return []

      if (!isSupabaseConfigured()) {
        let products = [...MOCK_PRODUCTS]
        if (query) {
          const q = query.toLowerCase()
          products = products.filter(p => p.title.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
        }
        if (filters.categoryId) products = products.filter(p => p.category_id === filters.categoryId)
        if (filters.minPrice) products = products.filter(p => Number(p.price) >= filters.minPrice!)
        if (filters.maxPrice) products = products.filter(p => Number(p.price) <= filters.maxPrice!)
        if (filters.condition) products = products.filter(p => p.condition === filters.condition)
        return products.slice(0, 50) as Product[]
      }

      const supabase = createClient()

      let qb = supabase
        .from('products')
        .select(`
          *,
          images:product_images(url, is_cover, sort_order),
          seller:profiles!seller_id(id, nickname, avatar_url)
        `)
        .eq('status', 'active')

      if (query) {
        qb = qb.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      }

      if (filters.categoryId) {
        qb = qb.eq('category_id', filters.categoryId)
      }

      if (filters.minPrice) {
        qb = qb.gte('price', filters.minPrice)
      }
      if (filters.maxPrice) {
        qb = qb.lte('price', filters.maxPrice)
      }

      if (filters.condition) {
        qb = qb.eq('condition', filters.condition)
      }

      if (filters.tradeMethod) {
        if (filters.tradeMethod === 'both') {
          qb = qb.in('trade_method', ['both', 'offline', 'escrow'])
        } else {
          qb = qb.in('trade_method', [filters.tradeMethod, 'both'])
        }
      }

      switch (filters.sort) {
        case 'newest':
          qb = qb.order('created_at', { ascending: false })
          break
        case 'price_asc':
          qb = qb.order('price', { ascending: true })
          break
        case 'price_desc':
          qb = qb.order('price', { ascending: false })
          break
        case 'popular':
          qb = qb.order('view_count', { ascending: false })
          break
        default:
          qb = qb.order('created_at', { ascending: false })
      }

      qb = qb.limit(50)

      const { data, error } = await qb
      if (error) throw error
      return data as Product[]
    },
    enabled: !!query || !!filters.categoryId,
  })
}
