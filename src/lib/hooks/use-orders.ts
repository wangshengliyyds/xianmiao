'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { OrderWithDetails, OrderStatus, PaginatedResponse } from '@/types'

export function useOrders(
  role: 'buyer' | 'seller' = 'buyer',
  status?: OrderStatus | 'all',
  page = 1,
  pageSize = 20
) {
  return useQuery({
    queryKey: ['orders', role, status, page, pageSize],
    queryFn: async (): Promise<PaginatedResponse<OrderWithDetails>> => {
      const params = new URLSearchParams()
      params.set('role', role)
      params.set('page', page.toString())
      params.set('page_size', pageSize.toString())
      if (status) params.set('status', status)

      const res = await fetch(`/api/orders?${params}`)
      if (!res.ok) throw new Error('获取订单列表失败')
      return res.json()
    },
    staleTime: 30 * 1000,
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async (): Promise<OrderWithDetails> => {
      const res = await fetch(`/api/orders/${id}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '获取订单详情失败')
      }
      const { data } = await res.json()
      return data
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '创建订单失败')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderId, action, remark }: { orderId: string; action: string; remark?: string }) => {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, remark }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '更新订单状态失败')
      }
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] })
    },
  })
}
