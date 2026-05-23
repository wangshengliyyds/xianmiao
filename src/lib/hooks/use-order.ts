'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { MOCK_ORDERS } from '@/lib/mock-data'

// Mock 模式下维护的可变订单状态
const mockOrderState = new Map<string, string>()
import type { Order } from '@/types/order'

// 生成订单号
export function generateOrderNo(): string {
  const now = new Date()
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('')
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `XM${date}${random}`
}

// 获取订单列表
export function useOrders(role?: 'buyer' | 'seller') {
  return useQuery({
    queryKey: ['orders', role],
    queryFn: async () => {
      if (!isSupabaseConfigured()) return MOCK_ORDERS

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      let query = supabase
        .from('orders')
        .select(`
          *,
          product:products(id, title, price, images:product_images(url, is_cover)),
          buyer:profiles!buyer_id(id, nickname, avatar_url),
          seller:profiles!seller_id(id, nickname, avatar_url)
        `)
        .order('created_at', { ascending: false })

      if (role === 'buyer') {
        query = query.eq('buyer_id', user.id)
      } else if (role === 'seller') {
        query = query.eq('seller_id', user.id)
      } else {
        query = query.or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Order[]
    },
  })
}

// 获取单个订单
export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        const order = MOCK_ORDERS.find(o => o.id === id) || MOCK_ORDERS[0]
        const overrideStatus = mockOrderState.get(order.id)
        return overrideStatus ? { ...order, status: overrideStatus as Order['status'] } : order
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          product:products(id, title, price, description, images:product_images(url, is_cover)),
          buyer:profiles!buyer_id(id, nickname, avatar_url, phone),
          seller:profiles!seller_id(id, nickname, avatar_url, phone)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Order
    },
  })
}

// 创建订单
export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      productId: string
      sellerId: string
      tradeMethod: 'offline' | 'escrow'
      unitPrice: number
      quantity?: number
      skuId?: string
      addressId?: string
      couponId?: string
      remark?: string
    }) => {
      if (!isSupabaseConfigured()) {
        const quantity = params.quantity || 1
        return {
          id: `mock-order-${Date.now()}`,
          order_no: generateOrderNo(),
          product_id: params.productId,
          buyer_id: 'mock-user-1',
          seller_id: params.sellerId,
          trade_method: params.tradeMethod,
          sku_id: params.skuId || null,
          quantity,
          unit_price: String(params.unitPrice),
          total_amount: String(params.unitPrice * quantity),
          shipping_fee: '0',
          coupon_id: params.couponId || null,
          discount_amount: '0',
          pay_amount: String(params.unitPrice * quantity),
          commission: String(params.unitPrice * quantity * 0.01),
          status: 'pending_pay' as const,
          address_snapshot: null,
          logistics_company: null,
          logistics_no: null,
          remark: params.remark || null,
          auto_confirm_at: new Date(Date.now() + 7 * 86400000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as unknown as Order
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('请先登录')

      const quantity = params.quantity || 1
      const totalAmount = params.unitPrice * quantity
      const shippingFee = 0
      const discountAmount = 0
      const payAmount = totalAmount + shippingFee - discountAmount
      const commission = payAmount * 0.01

      let addressSnapshot = null
      if (params.addressId) {
        const { data: addr } = await supabase
          .from('addresses')
          .select('*')
          .eq('id', params.addressId)
          .single()
        addressSnapshot = addr
      }

      const { data, error } = await supabase
        .from('orders')
        .insert({
          order_no: generateOrderNo(),
          product_id: params.productId,
          buyer_id: user.id,
          seller_id: params.sellerId,
          trade_method: params.tradeMethod,
          sku_id: params.skuId || null,
          quantity,
          unit_price: params.unitPrice,
          total_amount: totalAmount,
          shipping_fee: shippingFee,
          coupon_id: params.couponId || null,
          discount_amount: discountAmount,
          pay_amount: payAmount,
          commission,
          status: 'pending_pay',
          address_snapshot: addressSnapshot,
          remark: params.remark || null,
          auto_confirm_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      await supabase
        .from('products')
        .update({ status: 'reserved' })
        .eq('id', params.productId)

      return data as Order
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

// 更新订单状态
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
      remark,
    }: {
      orderId: string
      status: string
      remark?: string
    }) => {
      if (!isSupabaseConfigured()) {
        mockOrderState.set(orderId, status)
        return
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (error) throw error

      await supabase.from('order_status_logs').insert({
        order_id: orderId,
        to_status: status,
        operator_id: user?.id,
        remark,
      })

      if (status === 'completed' || status === 'cancelled') {
        const { data: order } = await supabase
          .from('orders')
          .select('product_id')
          .eq('id', orderId)
          .single()

        if (order) {
          await supabase
            .from('products')
            .update({
              status: status === 'completed' ? 'sold' : 'active',
            })
            .eq('id', order.product_id)
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order'] })
    },
  })
}
