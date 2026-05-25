'use client'

import { useEffect, useState } from 'react'
import { Package } from 'lucide-react'
import { BackHeader } from '@/components/common/back-header'
import { OrderCard } from '@/components/order/order-card'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import type { OrderWithDetails } from '@/types'

export default function SoldPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/orders?role=seller&page=1&page_size=50')
      .then((res) => res.json())
      .then(({ data }) => setOrders(data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <BackHeader title="我卖出的" />

      <div className="mx-auto max-w-2xl px-4 py-6">
        {loading ? (
          <LoadingSpinner text="加载中..." />
        ) : orders.length === 0 ? (
          <EmptyState icon={<Package className="h-8 w-8 stroke-[2] text-muted-foreground/40" />} title="暂无卖出记录" description="还没有卖出过商品" />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} role="seller" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
