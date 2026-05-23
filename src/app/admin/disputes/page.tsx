'use client'

import Image from 'next/image'
import { useAdminDisputes, useAdminResolveDispute } from '@/lib/hooks/use-admin'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { AlertTriangle, Check, X, Package } from 'lucide-react'
import { formatPrice } from '@/lib/format'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/types/order'

export default function AdminDisputesPage() {
  const { data: disputes, isLoading } = useAdminDisputes()
  const resolve = useAdminResolveDispute()

  const handleResolve = (orderId: string, action: 'approve' | 'reject') => {
    resolve.mutate(
      {
        orderId,
        status: action === 'approve' ? 'refunded' : 'completed',
        remark: action === 'approve' ? '管理员同意退款' : '管理员驳回退款',
      },
      {
        onSuccess: () => toast.success(action === 'approve' ? '已同意退款' : '已驳回退款'),
        onError: () => toast.error('操作失败'),
      }
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">交易纠纷</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : disputes && disputes.length > 0 ? (
        <div className="space-y-3">
          {disputes.map((order: any) => {
            const cover = order.product?.images?.[0]
            return (
              <div key={order.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {cover ? (
                      <Image src={cover.url} alt="" fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{order.product?.title}</h3>
                      <Badge variant="destructive" className="text-xs">
                        {ORDER_STATUS_LABELS[order.status as OrderStatus]}
                      </Badge>
                    </div>
                    <p className="text-sm font-bold text-primary">{formatPrice(Number(order.pay_amount))}</p>
                    <p className="text-xs text-muted-foreground">
                      买家: {order.buyer?.nickname} · 卖家: {order.seller?.nickname}
                    </p>
                    {order.remark && (
                      <p className="mt-1 text-xs text-muted-foreground">原因: {order.remark}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleResolve(order.id, 'reject')}>
                      <X className="mr-1 h-3 w-3" />
                      驳回
                    </Button>
                    <Button size="sm" onClick={() => handleResolve(order.id, 'approve')}>
                      <Check className="mr-1 h-3 w-3" />
                      同意退款
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="py-16 text-center">
          <Check className="mx-auto mb-3 h-12 w-12 text-green-500" />
          <p className="text-sm text-muted-foreground">暂无待处理纠纷</p>
        </div>
      )}
    </div>
  )
}
