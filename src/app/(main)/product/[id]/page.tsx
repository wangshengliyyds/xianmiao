'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Heart, Share2, MessageCircle, ShoppingCart, Star, ChevronLeft, Sparkles, Flag } from 'lucide-react'
import { SmartImage } from '@/components/ui/smart-image'
import { formatPrice, formatRelativeTime, formatCount } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ConditionBadge } from '@/components/product/condition-badge'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { ReportDialog } from '@/components/common/report-dialog'
import { useCreateConversation } from '@/lib/hooks/use-conversations'
import { useToggleFavorite } from '@/lib/hooks/use-products'
import { useCreateOrder } from '@/lib/hooks/use-orders'
import { useAuth } from '@/lib/hooks/use-auth'
import { toast } from 'sonner'
import type { ProductWithImages } from '@/types'

const tradeMethodLabels: Record<string, string> = {
  offline: '仅自提',
  escrow: '仅担保交易',
  both: '自提/担保均可',
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<ProductWithImages | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImage, setCurrentImage] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [selectedSku, setSelectedSku] = useState<string | null>(null)
  const [showReport, setShowReport] = useState(false)

  const createConversation = useCreateConversation()
  const toggleFavorite = useToggleFavorite()
  const createOrder = useCreateOrder()
  const { user } = useAuth()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${params.id}`)
        if (res.ok) {
          const { data } = await res.json()
          setProduct(data)
        } else {
          toast.error('商品不存在')
          router.push('/')
        }
      } catch {
        toast.error('加载失败')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()

    // 检查是否已收藏（仅登录用户）
    if (user) {
      fetch(`/api/favorites?product_id=${params.id}`)
        .then((r) => r.ok ? r.json() : { favorited: false })
        .then(({ favorited }) => { if (favorited) setIsFavorited(true) })
        .catch(() => {})
    }
  }, [params.id, router])

  const handleContactSeller = async () => {
    if (!product) return
    if (!user) {
      toast.error('请先登录')
      router.push('/login')
      return
    }

    try {
      const result = await createConversation.mutateAsync({
        targetUserId: product.seller_id,
        productId: product.id,
      })
      router.push(`/chat/${result.data.id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '创建会话失败')
    }
  }

  const handleToggleFavorite = async () => {
    if (!product) return

    try {
      await toggleFavorite.mutateAsync({
        productId: product.id,
        isFavorited,
      })
      setIsFavorited(!isFavorited)
      toast.success(isFavorited ? '已取消收藏' : '已收藏')
    } catch {
      toast.error('操作失败')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: product?.title,
        text: `看看这个二手好物：${product?.title}`,
        url: window.location.href,
      })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('链接已复制')
    }
  }

  const handleBuy = async () => {
    if (!product) return
    if (!user) {
      toast.error('请先登录')
      router.push('/login')
      return
    }
    try {
      const result = await createOrder.mutateAsync({
        product_id: product.id,
        quantity: 1,
        trade_method: product.trade_method === 'offline' ? 'offline' : 'escrow',
        ...(selectedSku ? { sku_id: selectedSku } : {}),
      })
      toast.success('下单成功')
      router.push(`/order/${result.data.id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '下单失败')
    }
  }

  if (loading) {
    return <LoadingSpinner text="加载中..." />
  }

  if (!product) {
    return null
  }

  const images = product.images || []
  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order)
  const seller = product.seller as { id: string; nickname: string; avatar_url: string | null; credit_score?: number; created_at?: string } | undefined

  return (
    <div className="pb-20">
      {/* 图片轮播 */}
      <div className="relative">
        <div className="relative aspect-square bg-muted">
          {sortedImages.length > 0 ? (
            <SmartImage
              src={sortedImages[currentImage]?.url || '/placeholder.svg'}
              alt={product.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              暂无图片
            </div>
          )}
        </div>

        {/* 返回按钮 */}
        <button
          onClick={() => router.back()}
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm"
        >
          <ChevronLeft className="h-5 w-5 stroke-[2]" />
        </button>

        {/* 操作按钮 */}
        <div className="absolute right-4 top-4 flex gap-2">
          {user && user.id !== product.seller_id && (
            <button
              onClick={() => setShowReport(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm"
            >
              <Flag className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={handleShare}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        {/* 图片指示器 */}
        {sortedImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
            {sortedImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImage(index)}
                className={`h-1.5 rounded-full transition-all ${
                  currentImage === index
                    ? 'w-4 bg-white'
                    : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 缩略图列表 */}
      {sortedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-2">
          {sortedImages.map((img, index) => (
            <button
              key={img.id}
              onClick={() => setCurrentImage(index)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                currentImage === index ? 'border-primary' : 'border-transparent'
              }`}
            >
              <SmartImage
                src={img.url}
                alt={`图片${index + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* 商品信息 */}
      <div className="px-4 py-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h1 className="flex-1 text-xl font-bold leading-snug">
            {product.title}
          </h1>
          <button
            onClick={handleToggleFavorite}
            className={`shrink-0 rounded-full p-2 transition-colors ${
              isFavorited ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
            }`}
          >
            <Heart className={`h-6 w-6 ${isFavorited ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-primary">
            {formatPrice(product.price)}
          </span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.original_price)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <ConditionBadge condition={product.condition} />
          <Badge variant="outline">
            {tradeMethodLabels[product.trade_method] || product.trade_method}
          </Badge>
        </div>

        {/* SKU 选择 */}
        {product.skus && product.skus.length > 0 && (
          <div className="mt-3">
            <p className="mb-2 text-sm font-medium">规格</p>
            <div className="flex flex-wrap gap-2">
              {product.skus.map((sku) => (
                <button
                  key={sku.id}
                  onClick={() => setSelectedSku(sku.id === selectedSku ? null : sku.id)}
                  disabled={sku.stock <= 0}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    selectedSku === sku.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : sku.stock <= 0
                      ? 'border-border bg-muted/50 text-muted-foreground line-through'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {sku.spec_name}
                  {sku.price_override != null && sku.price_override !== product.price && (
                    <span className="ml-1 text-xs text-muted-foreground">+¥{sku.price_override - product.price}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* 卖家信息 */}
      {seller && (
        <>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-full bg-muted">
              {seller.avatar_url ? (
                <Image
                  src={seller.avatar_url}
                  alt={seller.nickname}
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-medium">
                  {seller.nickname[0]}
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">{seller.nickname}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {seller.credit_score !== undefined && (
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3" />
                    {seller.credit_score}分
                  </span>
                )}
                {seller.created_at && (
                  <span>{formatRelativeTime(seller.created_at)}加入</span>
                )}
              </div>
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* 商品描述 */}
      {product.description && (
        <>
          <div className="px-4 py-4">
            <h2 className="mb-2 font-semibold">商品描述</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </div>
          <Separator />
        </>
      )}

      {/* AI 分析 */}
      {product.ai_analysis && (
        <>
          <Separator />
          <div className="px-4 py-4">
            <div className="mb-3 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">AI 智能分析</h2>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 space-y-2">
              {product.ai_analysis.category_guess && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">分类识别</span>
                  <span className="font-medium">{product.ai_analysis.category_guess}</span>
                </div>
              )}
              {product.ai_analysis.brand_guess && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">品牌识别</span>
                  <span className="font-medium">{product.ai_analysis.brand_guess}</span>
                </div>
              )}
              {product.ai_analysis.condition_guess && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">成色评估</span>
                  <span className="font-medium">{product.ai_analysis.condition_guess}</span>
                </div>
              )}
              {product.ai_analysis.suggested_price != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">建议价格</span>
                  <span className="font-medium text-primary">¥{product.ai_analysis.suggested_price}</span>
                </div>
              )}
              {product.ai_analysis.risk_flags && product.ai_analysis.risk_flags.length > 0 && (
                <div className="flex items-start justify-between text-sm">
                  <span className="text-muted-foreground">风险提示</span>
                  <div className="flex flex-wrap justify-end gap-1">
                    {product.ai_analysis.risk_flags.map((flag, i) => (
                      <Badge key={i} variant="destructive" className="text-[10px]">{flag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 浏览信息 */}
      <div className="px-4 py-3 text-xs text-muted-foreground">
        <span>{formatCount(product.view_count)}次浏览</span>
        <span className="mx-2">·</span>
        <span>{formatCount(product.fav_count)}人想要</span>
        <span className="mx-2">·</span>
        <span>{formatRelativeTime(product.created_at)}发布</span>
      </div>

      {/* 底部操作栏 */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-bottom">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Button
            variant="outline"
            size="lg"
            onClick={handleContactSeller}
            disabled={createConversation.isPending}
            className="flex-1 gap-2"
          >
            <MessageCircle className="h-5 w-5" />
            联系卖家
          </Button>
          <Button
            size="lg"
            onClick={handleBuy}
            disabled={createOrder.isPending}
            className="flex-1 gap-2"
          >
            <ShoppingCart className="h-5 w-5" />
            {createOrder.isPending ? '下单中...' : '立即购买'}
          </Button>
        </div>
      </div>

      {/* 举报弹窗 */}
      <ReportDialog
        open={showReport}
        onClose={() => setShowReport(false)}
        targetType="product"
        targetId={product.id}
      />
    </div>
  )
}
