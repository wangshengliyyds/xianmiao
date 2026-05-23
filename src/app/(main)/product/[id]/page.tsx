'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useProduct, useFavorite, useIsFavorited } from '@/lib/hooks/use-products'
import { useGetOrCreatePrivateConversation } from '@/lib/hooks/use-chat'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Heart, Share2, MessageCircle, ChevronLeft,
  MapPin, Eye, Shield, Star,
} from 'lucide-react'
import { formatPrice, formatRelativeTime } from '@/lib/format'
import { CONDITION_LABELS, TRADE_METHOD_LABELS } from '@/types/product'
import { cn } from '@/lib/utils'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: product, isLoading } = useProduct(params.id as string)
  const { data: isFavorited } = useIsFavorited(params.id as string)
  const favorite = useFavorite()
  const getOrCreateConversation = useGetOrCreatePrivateConversation()

  const [currentImage, setCurrentImage] = useState(0)

  const handleFavorite = () => {
    if (!user) {
      toast.error('请先登录')
      router.push('/login')
      return
    }
    favorite.mutate(
      { productId: params.id as string, isFavorited: !!isFavorited },
      {
        onSuccess: () => toast.success(isFavorited ? '已取消收藏' : '已收藏'),
        onError: () => toast.error('操作失败'),
      }
    )
  }

  const handleChat = () => {
    if (!user) {
      toast.error('请先登录')
      router.push('/login')
      return
    }
    if (!product?.seller?.id) {
      toast.error('卖家信息异常')
      return
    }
    getOrCreateConversation.mutate(product.seller.id, {
      onSuccess: (conversationId) => {
        router.push(`/chat/${conversationId}`)
      },
      onError: () => toast.error('创建会话失败'),
    })
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="aspect-square animate-pulse bg-muted" />
        <div className="space-y-3 p-4">
          <div className="h-6 w-3/4 rounded bg-muted" />
          <div className="h-8 w-1/3 rounded bg-muted" />
          <div className="h-20 rounded bg-muted" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">商品不存在或已下架</p>
        <Button variant="link" onClick={() => router.push('/')}>返回首页</Button>
      </div>
    )
  }

  const images = product.images?.sort((a, b) => a.sort_order - b.sort_order) || []
  const coverImage = images[currentImage]

  return (
    <div className="mx-auto max-w-2xl pb-20">
      {/* 图片画廊 */}
      <div className="relative aspect-square bg-muted">
        {coverImage ? (
          <Image
            src={coverImage.url}
            alt={product.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 672px"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            暂无图片
          </div>
        )}

        {/* 返回按钮 */}
        <button
          onClick={() => router.back()}
          className="absolute left-3 top-3 rounded-full bg-black/30 p-2 text-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* 图片计数 */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
            {currentImage + 1}/{images.length}
          </div>
        )}

        {/* 图片缩略图 */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {images.map((img, index) => (
              <button
                key={img.id}
                onClick={() => setCurrentImage(index)}
                className={cn(
                  'h-2 w-2 rounded-full transition-colors',
                  index === currentImage ? 'bg-white' : 'bg-white/50'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* 商品信息 */}
      <div className="border-b p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h1 className="text-lg font-semibold leading-snug">{product.title}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary">{CONDITION_LABELS[product.condition]}</Badge>
              <Badge variant="secondary">{TRADE_METHOD_LABELS[product.trade_method]}</Badge>
              {product.is_merchant && <Badge variant="secondary">商家</Badge>}
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={handleFavorite} className="rounded-full p-2 hover:bg-muted">
              <Heart
                className={cn(
                  'h-5 w-5',
                  isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                )}
              />
            </button>
            <button className="rounded-full p-2 hover:bg-muted">
              <Share2 className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-primary">{formatPrice(product.price)}</span>
          {product.original_price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.original_price)}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {product.view_count} 浏览
          </span>
          <span>{formatRelativeTime(product.created_at)}</span>
        </div>
      </div>

      {/* 商品描述 */}
      {product.description && (
        <div className="border-b p-4">
          <h3 className="mb-2 text-sm font-medium">商品描述</h3>
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {product.description}
          </p>
        </div>
      )}

      {/* 卖家信息 */}
      <div className="border-b p-4">
        <Link
          href={`/profile/${product.seller?.id}`}
          className="flex items-center gap-3"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={product.seller?.avatar_url || undefined} />
            <AvatarFallback>{product.seller?.nickname?.[0] || '用'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">{product.seller?.nickname}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Star className="h-3 w-3 text-yellow-500" />
              <span>信用 {product.seller?.credit_score || 100}</span>
            </div>
          </div>
          <ChevronLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
        </Link>
      </div>

      {/* 交易保障 */}
      <div className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4 text-primary" />
          <span>闲妙担保交易，安全放心</span>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background safe-bottom md:relative md:border-0">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Button variant="outline" className="flex-1" onClick={handleChat}>
            <MessageCircle className="mr-2 h-4 w-4" />
            联系卖家
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              if (!user) {
                toast.error('请先登录')
                router.push('/login')
                return
              }
              router.push(`/product/${product.id}/buy`)
            }}
          >
            立即购买
          </Button>
        </div>
      </div>
    </div>
  )
}
