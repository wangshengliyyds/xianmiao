'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useProduct } from '@/lib/hooks/use-products'
import { useCreateOrder } from '@/lib/hooks/use-order'
import { useAddresses } from '@/lib/hooks/use-addresses'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  ChevronLeft, MapPin, Truck, Shield,
  Minus, Plus, ChevronRight, Loader2,
} from 'lucide-react'
import { formatPrice } from '@/lib/format'
import { CONDITION_LABELS } from '@/types/product'
import { cn } from '@/lib/utils'

export default function BuyPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: product, isLoading } = useProduct(params.id as string)
  const { data: addresses } = useAddresses()
  const createOrder = useCreateOrder()

  const [quantity, setQuantity] = useState(1)
  const [tradeMethod, setTradeMethod] = useState<'offline' | 'escrow'>('escrow')
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [remark, setRemark] = useState('')

  // 初始化默认地址和交易方式
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0]
      setSelectedAddressId(defaultAddr.id)
    }
  }, [addresses, selectedAddressId])

  useEffect(() => {
    if (product) {
      if (product.trade_method === 'offline') setTradeMethod('offline')
      else if (product.trade_method === 'escrow') setTradeMethod('escrow')
      else setTradeMethod('escrow')
    }
  }, [product])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="space-y-3 p-4">
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
          <div className="h-20 animate-pulse rounded-xl bg-muted" />
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

  if (!user) {
    router.push('/login')
    return null
  }

  const coverImage = product.images?.find((img) => img.is_cover) || product.images?.[0]
  const unitPrice = Number(product.price)
  const totalAmount = unitPrice * quantity
  const shippingFee = tradeMethod === 'offline' ? 0 : 0 // TODO: 根据地址计算
  const payAmount = totalAmount + shippingFee

  const handleSubmit = async () => {
    if (tradeMethod === 'escrow' && !selectedAddressId) {
      toast.error('请选择收货地址')
      return
    }

    if (product.seller?.id === user.id) {
      toast.error('不能购买自己的商品')
      return
    }

    createOrder.mutate(
      {
        productId: product.id,
        sellerId: product.seller?.id || '',
        tradeMethod,
        unitPrice,
        quantity,
        addressId: tradeMethod === 'escrow' ? selectedAddressId : undefined,
        remark: remark || undefined,
      },
      {
        onSuccess: (order) => {
          toast.success('下单成功')
          router.replace(`/order/${order.id}`)
        },
        onError: (err) => {
          toast.error(err.message || '下单失败')
        },
      }
    )
  }

  const selectedAddress = addresses?.find((a) => a.id === selectedAddressId)
  const showAddress = tradeMethod === 'escrow'

  return (
    <div className="mx-auto max-w-2xl pb-24">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b bg-background px-4 py-3">
        <button onClick={() => router.back()} className="p-1">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">确认订单</h1>
      </div>

      {/* 收货地址（担保交易） */}
      {showAddress && (
        <button
          onClick={() => router.push(`/profile/addresses`)}
          className="flex w-full items-center gap-3 border-b px-4 py-3 text-left"
        >
          <MapPin className="h-5 w-5 shrink-0 text-primary" />
          {selectedAddress ? (
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedAddress.name}</span>
                <span className="text-sm text-muted-foreground">{selectedAddress.phone}</span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {selectedAddress.province}{selectedAddress.city}{selectedAddress.district}{selectedAddress.detail}
              </p>
            </div>
          ) : (
            <div className="flex-1">
              <p className="text-sm text-primary">请添加收货地址</p>
            </div>
          )}
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      )}

      {/* 商品信息 */}
      <div className="flex gap-3 border-b px-4 py-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
          {coverImage ? (
            <Image src={coverImage.url} alt={product.title} fill className="object-cover" sizes="80px" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">无图</div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <p className="line-clamp-2 text-sm font-medium">{product.title}</p>
            <div className="mt-1 flex items-center gap-1">
              <Badge variant="secondary" className="text-xs">{CONDITION_LABELS[product.condition]}</Badge>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">{formatPrice(unitPrice)}</span>
          </div>
        </div>
      </div>

      {/* 交易方式 */}
      {product.trade_method === 'both' && (
        <div className="border-b px-4 py-3">
          <h3 className="mb-2 text-sm font-medium">交易方式</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setTradeMethod('escrow')}
              className={cn(
                'flex flex-1 items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors',
                tradeMethod === 'escrow' ? 'border-primary bg-primary/5' : ''
              )}
            >
              <Shield className="h-4 w-4 text-primary" />
              <div>
                <p className="font-medium">平台担保</p>
                <p className="text-xs text-muted-foreground">安全交易，平台托管</p>
              </div>
            </button>
            <button
              onClick={() => setTradeMethod('offline')}
              className={cn(
                'flex flex-1 items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors',
                tradeMethod === 'offline' ? 'border-primary bg-primary/5' : ''
              )}
            >
              <Truck className="h-4 w-4 text-primary" />
              <div>
                <p className="font-medium">同城自提</p>
                <p className="text-xs text-muted-foreground">线下见面交易</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 数量 */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-medium">购买数量</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="rounded-full border p-1 disabled:opacity-30"
          >
            <Minus className="h-4 w-4" />
          </button>
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            className="h-8 w-14 text-center text-sm"
          />
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="rounded-full border p-1"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 备注 */}
      <div className="border-b px-4 py-3">
        <h3 className="mb-2 text-sm font-medium">备注</h3>
        <Textarea
          placeholder="给卖家留言（选填）"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          className="min-h-[60px] resize-none text-sm"
        />
      </div>

      {/* 价格明细 */}
      <div className="space-y-2 border-b px-4 py-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">商品总价</span>
          <span>{formatPrice(totalAmount)}</span>
        </div>
        {shippingFee > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">运费</span>
            <span>{formatPrice(shippingFee)}</span>
          </div>
        )}
        <div className="flex justify-between border-t pt-2">
          <span className="font-medium">应付金额</span>
          <span className="text-lg font-bold text-primary">{formatPrice(payAmount)}</span>
        </div>
      </div>

      {/* 底部提交栏 */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background safe-bottom md:relative md:border-0">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div>
            <span className="text-sm text-muted-foreground">合计: </span>
            <span className="text-xl font-bold text-primary">{formatPrice(payAmount)}</span>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={createOrder.isPending}
            className="min-w-[120px]"
          >
            {createOrder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            提交订单
          </Button>
        </div>
      </div>
    </div>
  )
}
