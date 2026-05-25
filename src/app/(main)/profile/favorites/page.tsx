'use client'

import { useEffect, useState } from 'react'
import { Heart, X } from 'lucide-react'
import { BackHeader } from '@/components/common/back-header'
import { BuyerGuard } from '@/components/common/buyer-guard'
import { ProductCard } from '@/components/product/product-card'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { toast } from 'sonner'
import type { ProductWithImages } from '@/types'

export default function FavoritesPage() {
  return (
    <BuyerGuard>
      <FavoritesContent />
    </BuyerGuard>
  )
}

function FavoritesContent() {
  const [products, setProducts] = useState<ProductWithImages[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/favorites?page=1&page_size=50')
      .then((res) => res.json())
      .then(({ data }) => {
        const items = (data || []).map((item: { product: ProductWithImages }) => item.product).filter(Boolean)
        setProducts(items)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleUnfavorite = async (productId: string) => {
    try {
      const res = await fetch(`/api/favorites?product_id=${productId}`, { method: 'DELETE' })
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productId))
        toast.success('已取消收藏')
      }
    } catch {
      toast.error('操作失败')
    }
  }

  return (
    <div>
      <BackHeader title="我的收藏" />

      <div className="mx-auto max-w-2xl px-4 py-6">
        {loading ? (
          <LoadingSpinner text="加载中..." />
        ) : products.length === 0 ? (
          <EmptyState icon={<Heart className="h-8 w-8 stroke-[2] text-muted-foreground/40" />} title="暂无收藏" description="收藏喜欢的商品，方便下次找到" />
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">共 {products.length} 件收藏</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <div key={product.id} className="group relative">
                  <ProductCard product={product} />
                  <button
                    onClick={() => handleUnfavorite(product.id)}
                    className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-4 w-4 stroke-[2]" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
