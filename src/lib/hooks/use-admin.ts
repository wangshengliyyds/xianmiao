'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { MOCK_ADMIN_STATS } from '@/lib/mock-data'

// 管理后台统计数据
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) return MOCK_ADMIN_STATS

      const supabase = createClient()

      const [users, products, orders, merchants] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('merchant_profiles').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      ])

      const today = new Date().toISOString().split('T')[0]
      const [todayUsers, todayOrders] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today),
      ])

      const { data: completedOrders } = await supabase
        .from('orders')
        .select('pay_amount')
        .eq('status', 'completed')

      const totalRevenue = completedOrders?.reduce((sum, o) => sum + Number(o.pay_amount), 0) || 0

      return {
        totalUsers: users.count || 0,
        totalProducts: products.count || 0,
        totalOrders: orders.count || 0,
        totalMerchants: merchants.count || 0,
        todayNewUsers: todayUsers.count || 0,
        todayNewOrders: todayOrders.count || 0,
        totalRevenue,
      }
    },
  })
}

// 用户列表
export function useAdminUsers(search?: string) {
  return useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      if (!isSupabaseConfigured()) return []

      const supabase = createClient()
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (search) {
        query = query.ilike('nickname', `%${search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

// 更新用户状态
export function useAdminUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { userId: string; role?: string; is_verified?: boolean }) => {
      if (!isSupabaseConfigured()) return

      const supabase = createClient()
      const updates: Record<string, unknown> = {}
      if (params.role !== undefined) updates.role = params.role
      if (params.is_verified !== undefined) updates.is_verified = params.is_verified

      const { error } = await supabase.from('profiles').update(updates).eq('id', params.userId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}

// 待审核商品
export function useAdminPendingProducts() {
  return useQuery({
    queryKey: ['admin-pending-products'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) return []

      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select('*, seller:profiles!seller_id(nickname), images:product_images(url, is_cover)')
        .eq('status', 'pending_review')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data
    },
  })
}

// 审核商品
export function useAdminReviewProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { productId: string; status: 'active' | 'rejected'; reason?: string }) => {
      if (!isSupabaseConfigured()) return

      const supabase = createClient()
      const { error } = await supabase
        .from('products')
        .update({ status: params.status })
        .eq('id', params.productId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-products'] })
    },
  })
}

// 商家审核列表
export function useAdminPendingMerchants() {
  return useQuery({
    queryKey: ['admin-pending-merchants'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) return []

      const supabase = createClient()
      const { data, error } = await supabase
        .from('merchant_profiles')
        .select('*, user:profiles!user_id(nickname, phone)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })
}

// 审核商家
export function useAdminReviewMerchant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { merchantId: string; status: 'approved' | 'rejected' }) => {
      if (!isSupabaseConfigured()) return

      const supabase = createClient()
      const updateData: Record<string, unknown> = { status: params.status }
      if (params.status === 'approved') {
        updateData.approved_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('merchant_profiles')
        .update(updateData)
        .eq('id', params.merchantId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-merchants'] })
    },
  })
}

// 纠纷订单
export function useAdminDisputes() {
  return useQuery({
    queryKey: ['admin-disputes'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) return []

      const supabase = createClient()
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          product:products(title, images:product_images(url, is_cover)),
          buyer:profiles!buyer_id(nickname),
          seller:profiles!seller_id(nickname)
        `)
        .in('status', ['refunding', 'disputed'])
        .order('updated_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data
    },
  })
}

// 处理纠纷
export function useAdminResolveDispute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { orderId: string; status: 'refunded' | 'completed'; remark: string }) => {
      if (!isSupabaseConfigured()) return

      const supabase = createClient()
      const { error } = await supabase
        .from('orders')
        .update({ status: params.status, updated_at: new Date().toISOString() })
        .eq('id', params.orderId)

      if (error) throw error

      await supabase.from('order_status_logs').insert({
        order_id: params.orderId,
        to_status: params.status,
        remark: params.remark,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] })
    },
  })
}
