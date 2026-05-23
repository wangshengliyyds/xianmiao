'use client'

import { useParams } from 'next/navigation'
import { useProducts, useCategories } from '@/lib/hooks/use-products'
import { ProductCard } from '@/components/product/product-card'
import { Skeleton } from '@/components/ui/skeleton'

export default function CategoryPage() {
  const params = useParams()
  const categoryId = parseInt(params.id as string)
  const { data: categories } = useCategories()
  const { data: products, isLoading } = useProducts({ categoryId })

  const category = categories?.find((c) => c.id === categoryId)

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-lg font-semibold">
        {category?.name || '分类商品'}
      </h1>

      {isLoading ? (
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
          该分类暂无商品
        </div>
      )}
    </div>
  )
}
