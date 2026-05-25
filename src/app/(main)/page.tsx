'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ChevronRight,
  Smartphone,
  Camera,
  Lamp,
  Shirt,
  BookOpen,
  Dumbbell,
  Home,
  Baby,
  Car,
  Package,
  Sparkles,
  ShoppingCart,
  Heart,
} from 'lucide-react'
import { ProductGrid } from '@/components/product/product-grid'
import { useAuth } from '@/lib/hooks/use-auth'
import type { ProductWithImages, Category, Banner } from '@/types'

// 分类图标配置 - 统一使用 Lucide 线性图标
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  '手机': Smartphone,
  '数码': Camera,
  '家电': Lamp,
  '服饰': Shirt,
  '图书': BookOpen,
  '运动': Dumbbell,
  '家居': Home,
  '母婴': Baby,
  '汽车': Car,
  '其他': Package,
}

// 备用静态分类
const fallbackCategories: Category[] = [
  { id: 1, name: '手机', icon_url: null, parent_id: null, sort_order: 0, ai_keywords: null, is_active: true },
  { id: 2, name: '数码', icon_url: null, parent_id: null, sort_order: 1, ai_keywords: null, is_active: true },
  { id: 3, name: '家电', icon_url: null, parent_id: null, sort_order: 2, ai_keywords: null, is_active: true },
  { id: 4, name: '服饰', icon_url: null, parent_id: null, sort_order: 3, ai_keywords: null, is_active: true },
  { id: 5, name: '图书', icon_url: null, parent_id: null, sort_order: 4, ai_keywords: null, is_active: true },
  { id: 6, name: '运动', icon_url: null, parent_id: null, sort_order: 5, ai_keywords: null, is_active: true },
  { id: 7, name: '家居', icon_url: null, parent_id: null, sort_order: 6, ai_keywords: null, is_active: true },
  { id: 8, name: '母婴', icon_url: null, parent_id: null, sort_order: 7, ai_keywords: null, is_active: true },
  { id: 9, name: '汽车', icon_url: null, parent_id: null, sort_order: 8, ai_keywords: null, is_active: true },
  { id: 10, name: '其他', icon_url: null, parent_id: null, sort_order: 9, ai_keywords: null, is_active: true },
]

export default function HomePage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<ProductWithImages[]>([])
  const [categories, setCategories] = useState<Category[]>(fallbackCategories)
  const [banners, setBanners] = useState<Banner[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const isBuyer = !user || user.role === 'buyer'

  // 加载数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 并行加载分类、banner、商品
        const [catRes, bannerRes, productRes] = await Promise.all([
          fetch('/api/categories').catch(() => null),
          fetch('/api/banners').catch(() => null),
          fetch('/api/products?page=1&page_size=20'),
        ])

        // 分类
        if (catRes?.ok) {
          const catData = await catRes.json()
          if (catData.data?.length > 0) {
            setCategories(catData.data)
          }
        }

        // Banner
        if (bannerRes?.ok) {
          const bannerData = await bannerRes.json()
          setBanners(bannerData.data || [])
        }

        // 商品
        if (productRes.ok) {
          const productData = await productRes.json()
          setProducts(productData.data || [])
          setHasMore(productData.has_more)
        }
      } catch {
        // 使用空数据
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchData()
  }, [])

  // 加载更多
  const loadMore = async () => {
    if (!hasMore || loadingMore) return

    setLoadingMore(true)
    const nextPage = page + 1
    try {
      const res = await fetch(`/api/products?page=${nextPage}&page_size=20`)
      if (res.ok) {
        const data = await res.json()
        setProducts((prev) => [...prev, ...(data.data || [])])
        setPage(nextPage)
        setHasMore(data.has_more)
      }
    } catch {
      // ignore
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* ===== 品牌区 ===== */}
      <section className="mb-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 px-6 py-8">
          <div className="relative z-10">
            <h1 className="text-2xl font-bold tracking-tight text-primary-foreground">
              闲妙
            </h1>
            <p className="mt-1.5 text-sm font-normal leading-relaxed text-primary-foreground/80">
              AI 驱动的同城二手闲置交易平台
            </p>
          </div>
          {/* 右下角装饰点 */}
          <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/5" />
          <div className="absolute -bottom-3 -right-3 h-16 w-16 rounded-full bg-white/5" />
        </div>
      </section>

      {/* ===== 分类区 ===== */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">分类</h2>
          <Link
            href="/search"
            className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            全部
            <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
          </Link>
        </div>
        <div className="grid grid-cols-5 gap-x-2 gap-y-4">
          {categories.slice(0, 10).map((cat) => {
            const IconComponent = categoryIcons[cat.name] || Package
            return (
              <Link
                key={cat.id}
                href={`/search?category_id=${cat.id}`}
                className="group flex flex-col items-center gap-2"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 transition-colors group-hover:bg-muted">
                  <IconComponent className="h-[22px] w-[22px] text-foreground/70 stroke-[1.8]" />
                </div>
                <span className="text-xs font-medium text-foreground/80">
                  {cat.name}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ===== 快捷入口 ===== */}
      {(isBuyer || user?.role === 'seller' || user?.role === 'merchant') && (
        <section className="mb-8">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: ShoppingCart, label: '我买到的', href: '/order?role=buyer' },
              { icon: Heart, label: '我的收藏', href: '/profile/favorites' },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-2 rounded-2xl border bg-card p-4 transition-colors hover:bg-muted/50">
                <item.icon className="h-6 w-6 text-primary stroke-[1.8]" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== 推荐商品区 ===== */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-[18px] w-[18px] text-primary stroke-[2]" />
          <h2 className="text-base font-semibold tracking-tight">推荐商品</h2>
        </div>

        <ProductGrid products={products} loading={loadingProducts} />

        {hasMore && products.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="rounded-full border border-border/60 bg-background px-8 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              {loadingMore ? '加载中...' : '加载更多'}
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
