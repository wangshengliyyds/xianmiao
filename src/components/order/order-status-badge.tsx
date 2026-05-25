import { Badge } from '@/components/ui/badge'
import { ORDER_STATUS } from '@/lib/constants'
import type { OrderStatus } from '@/types'

interface OrderStatusBadgeProps {
  status: OrderStatus
}

const statusVariant: Record<OrderStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
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

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <Badge variant={statusVariant[status] || 'outline'}>
      {ORDER_STATUS[status] || status}
    </Badge>
  )
}
