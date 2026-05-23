'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { MOCK_MERCHANT_STATS } from '@/lib/mock-data'

export interface MerchantProfile {
  id: string
  user_id: string
  store_name: string
  store_description: string | null
  logo_url: string | null
  status: 'pending' | 'approved' | 'rejected' | 'banned'
  rating: number
  total_sales: number
  created_at: string
  approved_at: string | null
}

// 获取当前用户的商家信息
export function useMyMerchant() {
  return useQuery({
    queryKey: ['my-merchant'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) return null

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('merchant_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data as MerchantProfile | null
    },
  })
}

// 申请成为商家
export function useApplyMerchant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      storeName: string
      storeDescription?: string
      logoUrl?: string
    }) => {
      if (!isSupabaseConfigured()) {
        return {
          id: `mock-merchant-${Date.now()}`,
          user_id: 'mock-user-1',
          store_name: params.storeName,
          store_description: params.storeDescription || null,
          logo_url: params.logoUrl || null,
          status: 'pending' as const,
          rating: 0,
          total_sales: 0,
          created_at: new Date().toISOString(),
          approved_at: null,
        }
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('请先登录')

      const { data, error } = await supabase
        .from('merchant_profiles')
        .insert({
          user_id: user.id,
          store_name: params.storeName,
          store_description: params.storeDescription || null,
          logo_url: params.logoUrl || null,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error

      await supabase
        .from('profiles')
        .update({ role: 'merchant' })
        .eq('id', user.id)

      return data as MerchantProfile
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-merchant'] })
    },
  })
}

// 获取商家的商品列表
export function useMerchantProducts(merchantId?: string) {
  return useQuery({
    queryKey: ['merchant-products', merchantId],
    queryFn: async () => {
      if (!isSupabaseConfigured()) return []

      const supabase = createClient()
      let query = supabase
        .from('products')
        .select('*, images:product_images(url, is_cover)')
        .order('created_at', { ascending: false })

      if (merchantId) {
        query = query.eq('seller_id', merchantId)
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []
        query = query.eq('seller_id', user.id)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: true,
  })
}

// 商家订单统计
export function useMerchantStats() {
  return useQuery({
    queryKey: ['merchant-stats'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) return MOCK_MERCHANT_STATS

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const statuses = ['pending_pay', 'paid', 'shipped', 'completed', 'cancelled'] as const
      const stats: Record<string, number> = {}

      for (const status of statuses) {
        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', user.id)
          .eq('status', status)
        stats[status] = count || 0
      }

      const { data: completed } = await supabase
        .from('orders')
        .select('pay_amount')
        .eq('seller_id', user.id)
        .eq('status', 'completed')

      const totalRevenue = completed?.reduce((sum, o) => sum + Number(o.pay_amount), 0) || 0

      return {
        pending_pay: stats.pending_pay || 0,
        paid: stats.paid || 0,
        shipped: stats.shipped || 0,
        completed: stats.completed || 0,
        cancelled: stats.cancelled || 0,
        totalRevenue,
      }
    },
  })
}
