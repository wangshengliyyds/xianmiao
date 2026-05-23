'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCategories, useProducts } from '@/lib/hooks/use-products'
import { CategoryGrid } from '@/components/product/category-grid'
import { ProductCard } from '@/components/product/product-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Sparkles, MapPin, Gift, ChevronRight,
  Flame, Clock,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

const BANNERS = [
  {
    id: 1,
    title: '新用户福利',
    subtitle: '首次交易免佣金',
    gradient: 'from-primary to-emerald-600',
    icon: Gift,
  },
  {
    id: 2,
    title: '同城好物',
    subtitle: '附近5公里的宝贝都在这',
    gradient: 'from-blue-500 to-indigo-600',
    icon: MapPin,
  },
  {
    id: 3,
    title: 'AI智能估价',
    subtitle: '拍照自动定价，轻松出闲置',
    gradient: 'from-purple-500 to-pink-500',
    icon: Sparkles,
  },
]

export default function HomePage() {
  const { user } = useAuthStore()
  const { data: categories, isLoading: categoriesLoading } = useCategories()
  const { data: products, isLoading: productsLoading } = useProducts({ limit: 20 })
  const [bannerIndex, setBannerIndex] = useState(0)
  const [claimed, setClaimed] = useState(false)

  const handleClaimCoupon = () => {
    if (!user) {
      toast.error('请先登录')
      return
    }
    setClaimed(true)
    toast.success('优惠券已领取！下单时自动抵扣')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* 轮播 Banner */}
      <section className="mb-6">
        <div
          className={cn(
            'relative h-40 rounded-2xl bg-gradient-to-r p-5 text-white overflow-hidden',
            BANNERS[bannerIndex].gradient
          )}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-1.5">
              {(() => {
                const Icon = BANNERS[bannerIndex].icon
                return <Icon className="h-5 w-5" />
              })()}
              <span className="text-sm opacity-80">闲妙推荐</span>
            </div>
            <h2 className="mt-3 text-2xl font-bold">{BANNERS[bannerIndex].title}</h2>
            <p className="mt-1 text-sm opacity-90">{BANNERS[bannerIndex].subtitle}</p>

            {bannerIndex === 0 && (
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={handleClaimCoupon}
                disabled={claimed}
              >
                {claimed ? '已领取' : '立即领取'}
              </Button>
            )}
            {bannerIndex === 1 && (
              <Link href="/map">
                <Button size="sm" variant="secondary" className="mt-3">
                  查看附近
                </Button>
              </Link>
            )}
            {bannerIndex === 2 && (
              <Link href="/product/publish">
                <Button size="sm" variant="secondary" className="mt-3">
                  去发布
                </Button>
              </Link>
            )}
          </div>

          {/* 装饰圆 */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
        </div>

        {/* 指示器 */}
        <div className="mt-3 flex justify-center gap-1.5">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setBannerIndex(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === bannerIndex ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'
              )}
            />
          ))}
        </div>
      </section>

      {/* 快捷入口 */}
      <section className="mb-6 grid grid-cols-4 gap-3">
        <Link href="/search" className="flex flex-col items-center gap-1.5 rounded-xl bg-muted/50 py-3 hover:bg-muted transition-colors">
          <Flame className="h-5 w-5 text-orange-500" />
          <span className="text-xs">热门</span>
        </Link>
        <Link href="/map" className="flex flex-col items-center gap-1.5 rounded-xl bg-muted/50 py-3 hover:bg-muted transition-colors">
          <MapPin className="h-5 w-5 text-blue-500" />
          <span className="text-xs">同城</span>
        </Link>
        <Link href="/product/publish" className="flex flex-col items-center gap-1.5 rounded-xl bg-muted/50 py-3 hover:bg-muted transition-colors">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <span className="text-xs">发布</span>
        </Link>
        <Link href="/circle" className="flex flex-col items-center gap-1.5 rounded-xl bg-muted/50 py-3 hover:bg-muted transition-colors">
          <Clock className="h-5 w-5 text-green-500" />
          <span className="text-xs">圈子</span>
        </Link>
      </section>

      {/* 分类 */}
      <section className="mb-6">
        {categoriesLoading ? (
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : categories && categories.length > 0 ? (
          <CategoryGrid categories={categories} />
        ) : (
          <CategoryGrid
            categories={[
              { id: 1, name: '手机', icon_url: null, parent_id: null, sort_order: 0, ai_keywords: [], is_active: true },
              { id: 2, name: '数码', icon_url: null, parent_id: null, sort_order: 1, ai_keywords: [], is_active: true },
              { id: 3, name: '家电', icon_url: null, parent_id: null, sort_order: 2, ai_keywords: [], is_active: true },
              { id: 4, name: '服饰', icon_url: null, parent_id: null, sort_order: 3, ai_keywords: [], is_active: true },
              { id: 5, name: '图书', icon_url: null, parent_id: null, sort_order: 4, ai_keywords: [], is_active: true },
              { id: 6, name: '运动', icon_url: null, parent_id: null, sort_order: 5, ai_keywords: [], is_active: true },
              { id: 7, name: '家居', icon_url: null, parent_id: null, sort_order: 6, ai_keywords: [], is_active: true },
              { id: 8, name: '母婴', icon_url: null, parent_id: null, sort_order: 7, ai_keywords: [], is_active: true },
              { id: 9, name: '汽车', icon_url: null, parent_id: null, sort_order: 8, ai_keywords: [], is_active: true },
              { id: 10, name: '其他', icon_url: null, parent_id: null, sort_order: 9, ai_keywords: [], is_active: true },
            ]}
          />
        )}
      </section>

      {/* 推荐商品 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">推荐商品</h2>
        {productsLoading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border">
                <Skeleton className="aspect-square" />
                <div className="p-2.5">
                  <Skeleton className="mb-1 h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-muted-foreground">
            暂无商品，快来发布第一件吧！
          </div>
        )}
      </section>
    </div>
  )
}
