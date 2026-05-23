'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useMyMerchant, useMerchantStats, useMerchantProducts } from '@/lib/hooks/use-merchant'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChevronLeft, Package, ShoppingBag, TrendingUp,
  DollarSign, Clock, CheckCircle, XCircle, Truck,
} from 'lucide-react'
import { formatPrice } from '@/lib/format'

export default function MerchantDashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: merchant, isLoading: merchantLoading } = useMyMerchant()
  const { data: stats } = useMerchantStats()
  const { data: products } = useMerchantProducts()

  if (!user) {
    router.push('/login')
    return null
  }

  if (merchantLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (!merchant || merchant.status !== 'approved') {
    router.push('/merchant/apply')
    return null
  }

  const statCards = [
    { label: '待付款', value: stats?.pending_pay || 0, icon: Clock, color: 'text-yellow-500' },
    { label: '待发货', value: stats?.paid || 0, icon: Package, color: 'text-blue-500' },
    { label: '已发货', value: stats?.shipped || 0, icon: Truck, color: 'text-purple-500' },
    { label: '已完成', value: stats?.completed || 0, icon: CheckCircle, color: 'text-green-500' },
  ]

  return (
    <div className="mx-auto max-w-2xl pb-6">
      {/* 顶部 */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b bg-background px-4 py-3">
        <button onClick={() => router.back()} className="p-1">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">商家中心</h1>
      </div>

      {/* 商家信息 */}
      <div className="border-b bg-gradient-to-r from-primary/5 to-transparent px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
            {merchant.store_name[0]}
          </div>
          <div>
            <h2 className="font-semibold">{merchant.store_name}</h2>
            <Badge variant="secondary" className="mt-1 text-xs">已认证商家</Badge>
          </div>
        </div>
      </div>

      {/* 收入卡片 */}
      <div className="border-b px-4 py-4">
        <div className="rounded-xl bg-primary/5 p-4">
          <p className="text-sm text-muted-foreground">累计收入</p>
          <p className="mt-1 text-3xl font-bold text-primary">{formatPrice(stats?.totalRevenue || 0)}</p>
        </div>
      </div>

      {/* 订单统计 */}
      <div className="border-b px-4 py-3">
        <h3 className="mb-3 text-sm font-medium">订单管理</h3>
        <div className="grid grid-cols-4 gap-2">
          {statCards.map((card) => (
            <button
              key={card.label}
              onClick={() => router.push('/order')}
              className="flex flex-col items-center gap-1 rounded-xl p-2 hover:bg-muted/50 transition-colors"
            >
              <card.icon className={`h-5 w-5 ${card.color}`} />
              <span className="text-lg font-bold">{card.value}</span>
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 商品管理 */}
      <div className="px-4 py-3">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">我的商品 ({products?.length || 0})</h3>
          <Link href="/product/publish">
            <Button size="sm" variant="outline">发布商品</Button>
          </Link>
        </div>

        {products && products.length > 0 ? (
          <div className="space-y-2">
            {products.slice(0, 5).map((product: any) => {
              const cover = product.images?.find((img: any) => img.is_cover) || product.images?.[0]
              return (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="flex items-center gap-3 rounded-lg border p-2 hover:bg-muted/50"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {cover ? (
                      <Image src={cover.url} alt="" fill className="object-cover" sizes="56px" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">{product.title}</p>
                    <p className="text-sm font-bold text-primary">{formatPrice(Number(product.price))}</p>
                  </div>
                  <Badge
                    variant={product.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {product.status === 'active' ? '在售' : product.status === 'reserved' ? '已预留' : product.status === 'sold' ? '已售出' : '下架'}
                  </Badge>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-muted-foreground">
            <ShoppingBag className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
            <p>暂无商品</p>
          </div>
        )}
      </div>
    </div>
  )
}
