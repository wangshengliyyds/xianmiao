'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BackHeader } from '@/components/common/back-header'
import { OrderCard } from '@/components/order/order-card'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { useOrders } from '@/lib/hooks/use-orders'
import { useAuth } from '@/lib/hooks/use-auth'
import { toast } from 'sonner'
import type { OrderStatus } from '@/types'

const statusTabs = [
  { value: 'all', label: '全部' },
  { value: 'pending_pay', label: '待付款' },
  { value: 'paid', label: '待发货' },
  { value: 'shipped', label: '待收货' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

export default function OrderListPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  const initialStatus = searchParams.get('status') || 'all'
  const initialRole = (searchParams.get('role') as 'buyer' | 'seller') || 'buyer'

  const isBuyer = user?.role === 'buyer'

  // 非买家访问 buyer 视图时重定向到 seller 视图
  const [activeStatus, setActiveStatus] = useState(initialStatus)
  const [role, setRole] = useState<'buyer' | 'seller'>(initialRole)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (authLoading || !user) return
    if (!isBuyer && role === 'buyer') {
      setRole('seller')
    }
  }, [user, authLoading, isBuyer, role])

  // 切换角色或状态时重置页码
  useEffect(() => {
    setPage(1)
  }, [role, activeStatus])

  const { data, isLoading } = useOrders(
    role,
    activeStatus as OrderStatus | 'all',
    page,
    20
  )

  const orders = data?.data || []

  if (authLoading) return <LoadingSpinner text="加载中..." />

  return (
    <div className="min-h-screen bg-background">
      <BackHeader title="我的订单" />

      {/* 角色切换 */}
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {isBuyer && (
            <button
              onClick={() => setRole('buyer')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                role === 'buyer'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              我买到的
            </button>
          )}
          <button
            onClick={() => setRole('seller')}
            className={`${isBuyer ? 'flex-1' : 'w-full'} rounded-lg py-2 text-sm font-medium transition-all ${
              role === 'seller'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            我卖出的
          </button>
        </div>
      </div>

      {/* 状态筛选栏 */}
      <div className="mx-auto max-w-2xl overflow-x-auto px-4 pt-3">
        <div className="flex gap-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveStatus(tab.value)}
              className={`flex-1 shrink-0 rounded-lg py-2 text-center text-sm font-medium transition-colors ${
                activeStatus === tab.value
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 订单列表 */}
      <div className="mx-auto max-w-2xl px-4 py-4">
        {isLoading ? (
          <LoadingSpinner text="加载中..." />
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-20">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60">
              <ClipboardList className="h-7 w-7 stroke-[1.5] text-muted-foreground/40" />
            </div>
            <h3 className="mb-1 text-base font-medium text-foreground">暂无订单</h3>
            <p className="text-sm text-muted-foreground">
              {role === 'buyer' ? '还没有购买过商品' : '还没有卖出过商品'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} role={role} />
              ))}
            </div>

            {data?.has_more && (
              <div className="mt-4 text-center">
                <Button variant="ghost" onClick={() => setPage((p) => p + 1)}>
                  加载更多
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
