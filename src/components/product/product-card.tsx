'use client'

import Link from 'next/link'
import { formatPrice } from '@/lib/format'
import { SmartImage } from '@/components/ui/smart-image'
import { Badge } from '@/components/ui/badge'
import type { ProductWithImages } from '@/types'

interface ProductCardProps {
  product: ProductWithImages
}

const conditionLabels: Record<string, string> = {
  new: '全新',
  like_new: '几乎全新',
  good: '成色较好',
  fair: '有使用痕迹',
  poor: '明显瑕疵',
}

export function ProductCard({ product }: ProductCardProps) {
  const coverImage = product.images?.find((img) => img.is_cover)?.url
    || product.images?.[0]?.url
    || '/placeholder.svg'

  const conditionLabel = conditionLabels[product.condition] || product.condition

  return (
    <Link
      href={`/product/${product.id}`}
      className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <SmartImage
          src={coverImage}
          alt={product.title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {product.condition !== 'new' && (
          <Badge
            variant="secondary"
            className="absolute left-2 top-2 text-xs bg-background/80 backdrop-blur-sm"
          >
            {conditionLabel}
          </Badge>
        )}
      </div>

      <div className="p-3">
        <h3 className="mb-1 line-clamp-2 text-sm font-medium leading-snug">
          {product.title}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-primary">
            {formatPrice(product.price)}
          </span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.original_price)}
            </span>
          )}
        </div>
        {product.seller && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            {product.seller.nickname}
          </p>
        )}
      </div>
    </Link>
  )
}
