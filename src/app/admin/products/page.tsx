'use client'

import Image from 'next/image'
import { useAdminPendingProducts, useAdminReviewProduct } from '@/lib/hooks/use-admin'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Check, X, ShoppingBag } from 'lucide-react'
import { formatPrice } from '@/lib/format'

export default function AdminProductsPage() {
  const { data: products, isLoading } = useAdminPendingProducts()
  const review = useAdminReviewProduct()

  const handleReview = (productId: string, status: 'active' | 'rejected') => {
    review.mutate(
      { productId, status },
      {
        onSuccess: () => toast.success(status === 'active' ? '已通过' : '已拒绝'),
        onError: () => toast.error('操作失败'),
      }
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">商品审核</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="space-y-3">
          {products.map((product: any) => {
            const cover = product.images?.find((img: any) => img.is_cover) || product.images?.[0]
            return (
              <div key={product.id} className="flex gap-4 rounded-xl border bg-card p-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {cover ? (
                    <Image src={cover.url} alt="" fill className="object-cover" sizes="96px" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{product.title}</h3>
                  <p className="mt-1 text-lg font-bold text-primary">{formatPrice(Number(product.price))}</p>
                  <p className="text-xs text-muted-foreground">
                    卖家: {(product.seller as any)?.nickname || '未知'} · {new Date(product.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500"
                    onClick={() => handleReview(product.id, 'rejected')}
                  >
                    <X className="mr-1 h-3 w-3" />
                    拒绝
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleReview(product.id, 'active')}
                  >
                    <Check className="mr-1 h-3 w-3" />
                    通过
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="py-16 text-center">
          <Check className="mx-auto mb-3 h-12 w-12 text-green-500" />
          <p className="text-sm text-muted-foreground">暂无待审核商品</p>
        </div>
      )}
    </div>
  )
}
