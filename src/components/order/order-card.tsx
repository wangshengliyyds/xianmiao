'use client'

import Link from 'next/link'
import { formatPrice, formatRelativeTime } from '@/lib/format'
import { SmartImage } from '@/components/ui/smart-image'
import { Badge } from '@/components/ui/badge'
import { ORDER_STATUS } from '@/lib/constants'
import type { OrderWithDetails } from '@/types'

interface OrderCardProps {
  order: OrderWithDetails
  role?: 'buyer' | 'seller'
}

export function OrderCard({ order, role = 'buyer' }: OrderCardProps) {
  const coverImage = order.product?.images?.find((img) => img.is_cover)?.url
    || order.product?.images?.[0]?.url
    || '/placeholder.svg'

  const statusLabel = ORDER_STATUS[order.status] || order.status

  const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending_pay: 'default',
    paid: 'secondary',
    shipped: 'secondary',
    delivered: 'secondary',
    completed: 'outline',
    cancelled: 'destructive',
    refunding: 'destructive',
    refunded: 'destructive',
    disputed: 'destructive',
  }

  return (
    <Link
      href={`/order/${order.id}`}
      className="block rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(order.created_at)}
        </span>
        <Badge variant={statusVariant[order.status] || 'outline'}>
          {statusLabel}
        </Badge>
      </div>

      <div className="flex gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
          <SmartImage
            src={coverImage}
            alt={order.product?.title || '商品'}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="mb-1 line-clamp-2 text-sm font-medium">
            {order.product?.title || '商品已删除'}
          </h3>
          <p className="text-lg font-bold text-primary">
            {formatPrice(order.pay_amount)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {role === 'buyer'
              ? `卖家: ${order.seller?.nickname || '未知'}`
              : `买家: ${order.buyer?.nickname || '未知'}`}
          </p>
        </div>
      </div>
    </Link>
  )
}
