'use client'

import Link from 'next/link'
import Image from 'next/image'
import { formatPrice, formatRelativeTime } from '@/lib/format'
import { Heart } from 'lucide-react'
import type { Product } from '@/types/product'
import { CONDITION_LABELS } from '@/types/product'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  onFavorite?: (id: string) => void
  isFavorited?: boolean
}

export function ProductCard({ product, onFavorite, isFavorited }: ProductCardProps) {
  const coverImage = product.images?.find((img) => img.is_cover) || product.images?.[0]

  return (
    <Link href={`/product/${product.id}`} className="group block">
      <div className="overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
        {/* 图片 */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {coverImage ? (
            <Image
              src={coverImage.url}
              alt={product.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              暂无图片
            </div>
          )}

          {/* 成色标签 */}
          <span className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
            {CONDITION_LABELS[product.condition]}
          </span>

          {/* 收藏按钮 */}
          {onFavorite && (
            <button
              className="absolute right-2 top-2 rounded-full bg-black/30 p-1.5 transition-colors hover:bg-black/50"
              onClick={(e) => {
                e.preventDefault()
                onFavorite(product.id)
              }}
            >
              <Heart
                className={cn(
                  'h-4 w-4',
                  isFavorited ? 'fill-red-500 text-red-500' : 'text-white'
                )}
              />
            </button>
          )}
        </div>

        {/* 信息 */}
        <div className="p-2.5">
          <h3 className="line-clamp-2 text-sm leading-snug">{product.title}</h3>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-base font-bold text-primary">
              {formatPrice(product.price)}
            </span>
            {product.original_price && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.original_price)}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
            {product.is_merchant && (
              <span className="rounded bg-primary/10 px-1 py-0.5 text-primary">商家</span>
            )}
            <span>{formatRelativeTime(product.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
