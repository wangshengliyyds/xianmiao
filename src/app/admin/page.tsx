'use client'

import Link from 'next/link'
import { useAdminStats } from '@/lib/hooks/use-admin'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users, ShoppingBag, Package, Store,
  TrendingUp, DollarSign, ArrowUpRight,
} from 'lucide-react'
import { formatPrice } from '@/lib/format'

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats()

  if (isLoading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">数据看板</h1>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const statCards = [
    { label: '总用户', value: stats?.totalUsers || 0, icon: Users, color: 'bg-blue-500', change: `今日 +${stats?.todayNewUsers || 0}` },
    { label: '总商品', value: stats?.totalProducts || 0, icon: ShoppingBag, color: 'bg-green-500', change: '在售商品数' },
    { label: '总订单', value: stats?.totalOrders || 0, icon: Package, color: 'bg-purple-500', change: `今日 +${stats?.todayNewOrders || 0}` },
    { label: '商家数', value: stats?.totalMerchants || 0, icon: Store, color: 'bg-orange-500', change: '已认证商家' },
    { label: '交易总额', value: formatPrice(stats?.totalRevenue || 0), icon: DollarSign, color: 'bg-emerald-500', change: '累计交易额', isCurrency: true },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">数据看板</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.color} text-white`}>
                <card.icon className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-3 text-2xl font-bold">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.change}</p>
          </div>
        ))}
      </div>

      {/* 快捷操作 */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">快捷操作</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Link href="/admin/users" className="rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors">
            <Users className="mb-2 h-5 w-5 text-blue-500" />
            <p className="text-sm font-medium">用户管理</p>
            <p className="text-xs text-muted-foreground">查看所有用户</p>
          </Link>
          <Link href="/admin/products" className="rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors">
            <ShoppingBag className="mb-2 h-5 w-5 text-green-500" />
            <p className="text-sm font-medium">商品审核</p>
            <p className="text-xs text-muted-foreground">审核待上架商品</p>
          </Link>
          <Link href="/admin/disputes" className="rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors">
            <TrendingUp className="mb-2 h-5 w-5 text-red-500" />
            <p className="text-sm font-medium">纠纷处理</p>
            <p className="text-xs text-muted-foreground">处理退款和纠纷</p>
          </Link>
          <Link href="/admin/merchants" className="rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors">
            <Store className="mb-2 h-5 w-5 text-orange-500" />
            <p className="text-sm font-medium">商家审核</p>
            <p className="text-xs text-muted-foreground">审核商家申请</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
