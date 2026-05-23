'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useOrders, useUpdateOrderStatus } from '@/lib/hooks/use-order'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ChevronLeft, Package, MessageCircle } from 'lucide-react'
import { formatPrice, formatRelativeTime } from '@/lib/format'
import { ORDER_STATUS_LABELS } from '@/types/order'
import { cn } from '@/lib/utils'

const TABS = [
  { value: '', label: '全部' },
  { value: 'pending_pay', label: '待付款' },
  { value: 'paid', label: '待发货' },
  { value: 'shipped', label: '待收货' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

export default function OrderListPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('')
  const { data: orders, isLoading } = useOrders()
  const updateStatus = useUpdateOrderStatus()

  const filteredOrders = activeTab
    ? orders?.filter((o) => o.status === activeTab)
    : orders

  const handleConfirmReceipt = (orderId: string) => {
    updateStatus.mutate(
      { orderId, status: 'completed', remark: '买家确认收货' },
      {
        onSuccess: () => toast.success('已确认收货'),
        onError: () => toast.error('操作失败'),
      }
    )
  }

  const handleCancel = (orderId: string) => {
    updateStatus.mutate(
      { orderId, status: 'cancelled', remark: '买家取消订单' },
      {
        onSuccess: () => toast.success('订单已取消'),
        onError: () => toast.error('操作失败'),
      }
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b bg-background px-4 py-3">
        <button onClick={() => router.back()} className="p-1">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">我的订单</h1>
      </div>

      {/* 状态标签 */}
      <div className="sticky top-14 z-30 border-b bg-background">
        <div className="flex overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'shrink-0 px-4 py-3 text-sm transition-colors relative',
                activeTab === tab.value
                  ? 'font-medium text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {activeTab === tab.value && (
                <div className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 订单列表 */}
      <div className="px-4 py-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="mt-3 flex gap-3">
                  <Skeleton className="h-16 w-16 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredOrders && filteredOrders.length > 0 ? (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const coverImage = order.product?.images?.find((img) => img.is_cover) || order.product?.images?.[0]
              const isBuyer = order.buyer_id === user.id
              const counterparty = isBuyer ? order.seller : order.buyer

              return (
                <div key={order.id} className="rounded-xl border">
                  {/* 订单头部 */}
                  <div className="flex items-center justify-between border-b px-4 py-2">
                    <span className="text-xs text-muted-foreground">{order.order_no}</span>
                    <Badge
                      variant={order.status === 'pending_pay' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </div>

                  {/* 商品信息 */}
                  <Link href={`/order/${order.id}`} className="flex gap-3 px-4 py-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {coverImage ? (
                        <Image src={coverImage.url} alt="" fill className="object-cover" sizes="64px" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium">{order.product?.title}</p>
                      <p className="mt-1 text-sm font-bold text-primary">{formatPrice(Number(order.pay_amount))}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {isBuyer ? '卖家' : '买家'}: {counterparty?.nickname || '未知'}
                      </p>
                    </div>
                  </Link>

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-end gap-2 border-t px-4 py-2">
                    <Link href={`/chat`}>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="mr-1 h-3 w-3" />
                        联系
                      </Button>
                    </Link>

                    {isBuyer && order.status === 'pending_pay' && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleCancel(order.id)}>
                          取消订单
                        </Button>
                        <Button size="sm" onClick={() => router.push(`/order/${order.id}`)}>
                          去付款
                        </Button>
                      </>
                    )}

                    {isBuyer && order.status === 'shipped' && (
                      <Button size="sm" onClick={() => handleConfirmReceipt(order.id)}>
                        确认收货
                      </Button>
                    )}

                    {!isBuyer && order.status === 'paid' && (
                      <Button size="sm" onClick={() => router.push(`/order/${order.id}`)}>
                        去发货
                      </Button>
                    )}

                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(order.created_at)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">暂无订单</p>
          </div>
        )}
      </div>
    </div>
  )
}
