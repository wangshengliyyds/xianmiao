'use client'

import Image from 'next/image'
import { useOrders } from '@/lib/hooks/use-order'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Package } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/format'
import { ORDER_STATUS_LABELS } from '@/types/order'

export default function AdminOrdersPage() {
  const { data: orders, isLoading } = useOrders()

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">订单管理</h1>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium">订单号</th>
                <th className="px-4 py-3 font-medium">商品</th>
                <th className="px-4 py-3 font-medium">金额</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">创建时间</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders?.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{order.order_no}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-muted">
                        {order.product?.images?.[0] ? (
                          <Image src={order.product.images[0].url} alt="" fill className="object-cover" sizes="32px" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <span className="line-clamp-1 max-w-[200px]">{order.product?.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-primary">{formatPrice(Number(order.pay_amount))}</td>
                  <td className="px-4 py-3">
                    <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!orders || orders.length === 0) && (
            <div className="py-10 text-center text-sm text-muted-foreground">暂无订单</div>
          )}
        </div>
      )}
    </div>
  )
}
