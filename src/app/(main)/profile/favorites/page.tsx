'use client'

import Link from 'next/link'
import { useProducts } from '@/lib/hooks/use-products'
import { ProductCard } from '@/components/product/product-card'
import { Loader2, Heart } from 'lucide-react'

export default function FavoritesPage() {
  const { data: products, isLoading } = useProducts({ limit: 20 })

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-lg font-semibold">我的收藏</h1>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : products && products.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {products.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`}>
              <ProductCard product={product} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center gap-3 text-muted-foreground">
          <Heart className="h-12 w-12" />
          <p className="text-sm">还没有收藏的商品</p>
          <Link href="/" className="text-sm text-primary hover:underline">
            去逛逛
          </Link>
        </div>
      )}
    </div>
  )
}
