'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_FAVORITE_IDS } from '@/lib/mock-data'
import type { Product, Category } from '@/types/product'

// 获取分类列表
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) return MOCK_CATEGORIES

      const supabase = createClient()
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (error) throw error
      return data as Category[]
    },
  })
}

// 获取商品列表
export function useProducts(options?: {
  categoryId?: number
  sellerId?: string
  status?: string
  limit?: number
}) {
  return useQuery({
    queryKey: ['products', options],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        let products = [...MOCK_PRODUCTS]
        if (options?.categoryId) products = products.filter(p => p.category_id === options.categoryId)
        return products.slice(0, options?.limit || 20)
      }

      const supabase = createClient()
      let query = supabase
        .from('products')
        .select(`
          *,
          images:product_images(url, is_cover, sort_order),
          seller:profiles!seller_id(id, nickname, avatar_url)
        `)
        .order('created_at', { ascending: false })

      if (options?.categoryId) {
        query = query.eq('category_id', options.categoryId)
      }
      if (options?.sellerId) {
        query = query.eq('seller_id', options.sellerId)
      }
      if (options?.status) {
        query = query.eq('status', options.status)
      } else {
        query = query.eq('status', 'active')
      }

      query = query.limit(options?.limit || 20)

      const { data, error } = await query
      if (error) throw error
      return data as Product[]
    },
  })
}

// 获取单个商品
export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        const product = MOCK_PRODUCTS.find(p => p.id === id) || MOCK_PRODUCTS[0]
        return { ...product, skus: [] }
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(*),
          seller:profiles!seller_id(id, nickname, avatar_url, credit_score),
          category:categories(id, name),
          skus:product_skus(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      // 增加浏览量（静默）
      supabase
        .from('products')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', id)
        .then(() => {})

      return data as Product & { skus: unknown[] }
    },
    staleTime: 30 * 1000,
  })
}

// 收藏/取消收藏
export function useFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ productId, isFavorited }: { productId: string; isFavorited: boolean }) => {
      if (!isSupabaseConfigured()) {
        if (isFavorited) {
          MOCK_FAVORITE_IDS.splice(MOCK_FAVORITE_IDS.indexOf(productId), 1)
        } else {
          MOCK_FAVORITE_IDS.push(productId)
        }
        return
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('请先登录')

      if (isFavorited) {
        await supabase.from('favorites').delete().match({ user_id: user.id, product_id: productId })
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, product_id: productId })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}

// 检查收藏状态
export function useIsFavorited(productId: string) {
  return useQuery({
    queryKey: ['favorite', productId],
    queryFn: async () => {
      if (!isSupabaseConfigured()) return MOCK_FAVORITE_IDS.includes(productId)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { data } = await supabase
        .from('favorites')
        .select('product_id')
        .match({ user_id: user.id, product_id: productId })
        .maybeSingle()

      return !!data
    },
  })
}
