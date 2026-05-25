'use client'

import { useEffect, useState } from 'react'
import { ClipboardList, Pencil, Trash2 } from 'lucide-react'
import { BackHeader } from '@/components/common/back-header'
import { ProductCard } from '@/components/product/product-card'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { ProductWithImages } from '@/types'

export default function MyProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<ProductWithImages[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMyProducts = async () => {
      try {
        const res = await fetch('/api/profile')
        if (!res.ok) return
        const { data: profile } = await res.json()
        if (!profile) return

        const productRes = await fetch(`/api/products?page=1&page_size=100&seller_id=${profile.id}`)
        if (productRes.ok) {
          const { data } = await productRes.json()
          setProducts(data || [])
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchMyProducts()
  }, [])

  const handleDelete = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' })
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productId))
        toast.success('已下架')
      } else {
        const err = await res.json()
        toast.error(err.error || '操作失败')
      }
    } catch {
      toast.error('操作失败')
    }
  }

  return (
    <div>
      <BackHeader title="我发布的" />

      <div className="mx-auto max-w-2xl px-4 py-6">
        {loading ? (
          <LoadingSpinner text="加载中..." />
        ) : products.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-8 w-8 stroke-[2] text-muted-foreground/40" />}
            title="暂无发布"
            description="快去发布你的第一个闲置吧"
            action={
              <Button onClick={() => router.push('/product/publish')}>
                去发布
              </Button>
            }
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">共 {products.length} 件商品</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <div key={product.id} className="group relative">
                  <ProductCard product={product} />
                  {product.status === 'active' && (
                    <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/product/${product.id}/edit`) }}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(product.id) }}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/80 text-white backdrop-blur-sm"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
