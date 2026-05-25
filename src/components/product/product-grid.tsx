'use client'

import { PackageOpen } from 'lucide-react'
import { ProductCard } from './product-card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ProductWithImages } from '@/types'

interface ProductGridProps {
  products: ProductWithImages[]
  loading?: boolean
}

export function ProductGrid({ products, loading }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border bg-card">
            <Skeleton className="aspect-square" />
            <div className="space-y-2 p-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60">
          <PackageOpen className="h-8 w-8 text-muted-foreground/50 stroke-[1.5]" />
        </div>
        <p className="text-sm font-medium text-foreground/60">暂无商品</p>
        <p className="mt-1 text-xs text-muted-foreground/60">快去发布你的闲置吧</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
