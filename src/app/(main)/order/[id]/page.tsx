'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Check, Clock, Truck, Package, AlertCircle, Star } from 'lucide-react'
import { SmartImage } from '@/components/ui/smart-image'
import { formatPrice, formatDateTime, formatRelativeTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { BackHeader } from '@/components/common/back-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { OrderStatusBadge } from '@/components/order/order-status-badge'
import { PaymentDialog } from '@/components/order/payment-dialog'
import { RefundDialog } from '@/components/order/refund-dialog'
import { useUpdateOrderStatus } from '@/lib/hooks/use-orders'
import { toast } from 'sonner'
import type { OrderWithDetails } from '@/types'

const statusSteps = [
  { key: 'pending_pay', label: '待付款', icon: Clock },
  { key: 'paid', label: '已付款', icon: Check },
  { key: 'shipped', label: '已发货', icon: Truck },
  { key: 'delivered', label: '已收货', icon: Package },
  { key: 'completed', label: '已完成', icon: Check },
]

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [showRefund, setShowRefund] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [ratingScore, setRatingScore] = useState(5)
  const [ratingContent, setRatingContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showShipDialog, setShowShipDialog] = useState(false)
  const [shipCompany, setShipCompany] = useState('')
  const [shipNo, setShipNo] = useState('')

  const logisticsCompanies = ['顺丰', '圆通', '中通', '韵达', '申通', '邮政', '其他']

  const updateStatus = useUpdateOrderStatus()

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${params.id}`)
        if (res.ok) {
          const { data } = await res.json()
          setOrder(data)
        } else {
          toast.error('订单不存在')
          router.push('/order')
        }
      } catch {
        toast.error('加载失败')
      } finally {
        setLoading(false)
      }
    }

    // 获取当前用户
    const fetchUser = fetch('/api/profile')
      .then((res) => res.json())
      .then((data) => setCurrentUserId(data.data?.id))
      .catch(() => {})

    Promise.all([fetchOrder(), fetchUser])
  }, [params.id, router])

  const handleAction = async (action: string) => {
    if (!order) return

    // 确认破坏性操作
    if (action === 'cancel' && !window.confirm('确定要取消该订单吗？')) return

    try {
      await updateStatus.mutateAsync({ orderId: order.id, action })
      toast.success('操作成功')
      // 重新获取订单
      const res = await fetch(`/api/orders/${order.id}`)
      if (res.ok) {
        const { data } = await res.json()
        setOrder(data)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    }
  }

  const handlePaymentConfirm = async (method: 'alipay' | 'wechat') => {
    await handleAction('pay')
    toast.success(`已通过${method === 'alipay' ? '支付宝' : '微信支付'}付款`)
    setShowPayment(false)
  }

  const handleSubmitRating = async () => {
    if (!order) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          score: ratingScore,
          content: ratingContent,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '评价失败')
      }
      toast.success('评价成功')
      setShowRating(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '评价失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleShip = async () => {
    if (!order || !shipCompany) {
      toast.error('请选择物流公司')
      return
    }
    if (!shipNo.trim()) {
      toast.error('请输入物流单号')
      return
    }
    try {
      await updateStatus.mutateAsync({
        orderId: order.id,
        action: 'ship',
        remark: JSON.stringify({ company: shipCompany, no: shipNo.trim() }),
      })
      toast.success('发货成功')
      setShowShipDialog(false)
      setShipCompany('')
      setShipNo('')
      const res = await fetch(`/api/orders/${order.id}`)
      if (res.ok) {
        const { data } = await res.json()
        setOrder(data)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '发货失败')
    }
  }

  if (loading) {
    return <LoadingSpinner text="加载中..." />
  }

  if (!order) {
    return null
  }

  const isBuyer = currentUserId === order.buyer_id
  const isSeller = currentUserId === order.seller_id
  const coverImage = order.product?.images?.find((img: { url: string; is_cover: boolean }) => img.is_cover)?.url
    || order.product?.images?.[0]?.url
    || '/placeholder.svg'

  const currentStepIndex = statusSteps.findIndex((s) => s.key === order.status)

  return (
    <div className="pb-6">
      <BackHeader title="订单详情" />

      {/* 订单状态 */}
      <div className="bg-primary/5 px-4 py-4">
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <span className="text-sm text-muted-foreground">
            {order.order_no}
          </span>
        </div>

        {/* 状态进度 */}
        {!['cancelled', 'refunding', 'refunded', 'disputed'].includes(order.status) && (
          <div className="mt-4 flex items-center justify-between">
            {statusSteps.map((step, index) => {
              const StepIcon = step.icon
              const isActive = index <= currentStepIndex
              const isCurrent = index === currentStepIndex

              return (
                <div key={step.key} className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  >
                    <StepIcon className="h-4 w-4" />
                  </div>
                  <span className={`mt-1 text-xs ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {order.status === 'cancelled' && (
          <div className="mt-2 flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            订单已取消
          </div>
        )}
      </div>

      <Separator />

      {/* 商品信息 */}
      <div className="flex gap-3 px-4 py-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
          <SmartImage
            src={coverImage}
            alt={order.product?.title || '商品'}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>
        <div className="flex-1">
          <h3 className="line-clamp-2 font-medium">
            {order.product?.title || '商品已删除'}
          </h3>
          <p className="mt-1 text-lg font-bold text-primary">
            {formatPrice(order.unit_price)} × {order.quantity}
          </p>
        </div>
      </div>

      <Separator />

      {/* 价格明细 */}
      <div className="px-4 py-3">
        <h3 className="mb-2 font-medium">价格明细</h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">商品总价</span>
            <span>{formatPrice(order.total_amount)}</span>
          </div>
          {order.shipping_fee > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">运费</span>
              <span>{formatPrice(order.shipping_fee)}</span>
            </div>
          )}
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-primary">
              <span>优惠</span>
              <span>-{formatPrice(order.discount_amount)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-medium">
            <span>实付款</span>
            <span className="text-lg text-primary">{formatPrice(order.pay_amount)}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* 交易信息 */}
      <div className="px-4 py-3">
        <h3 className="mb-2 font-medium">交易信息</h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">交易方式</span>
            <span>{order.trade_method === 'offline' ? '自提' : '担保交易'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">创建时间</span>
            <span>{formatDateTime(order.created_at)}</span>
          </div>
          {isBuyer && order.seller && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">卖家</span>
              <span>{(order.seller as { nickname: string }).nickname}</span>
            </div>
          )}
          {isSeller && order.buyer && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">买家</span>
              <span>{(order.buyer as { nickname: string }).nickname}</span>
            </div>
          )}
          {order.remark && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">备注</span>
              <span>{order.remark}</span>
            </div>
          )}
        </div>
      </div>

      {/* 物流信息 */}
      {['shipped', 'delivered', 'completed'].includes(order.status) && order.logistics_company && (
        <>
          <Separator />
          <div className="px-4 py-3">
            <h3 className="mb-2 font-medium">物流信息</h3>
            <div className="rounded-lg border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 text-primary" />
                <span className="font-medium">{order.logistics_company}</span>
              </div>
              {order.logistics_no && (
                <div className="mt-1.5 text-sm text-muted-foreground">
                  快递单号：{order.logistics_no}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 操作按钮 */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-bottom">
        <div className="mx-auto flex max-w-2xl items-center justify-end gap-3 px-4 py-3">
          {isBuyer && order.status === 'pending_pay' && (
            <>
              <Button variant="outline" onClick={() => handleAction('cancel')}>
                取消订单
              </Button>
              <Button onClick={() => setShowPayment(true)}>
                立即付款
              </Button>
            </>
          )}
          {isSeller && order.status === 'paid' && (
            <Button onClick={() => setShowShipDialog(true)}>
              确认发货
            </Button>
          )}
          {isBuyer && order.status === 'shipped' && (
            <Button onClick={() => handleAction('confirm')}>
              确认收货
            </Button>
          )}
          {isBuyer && order.status === 'delivered' && (
            <Button onClick={() => handleAction('complete')}>
              完成订单
            </Button>
          )}
          {isBuyer && ['paid', 'shipped', 'delivered'].includes(order.status) && (
            <Button variant="outline" className="text-destructive" onClick={() => setShowRefund(true)}>
              申请退款
            </Button>
          )}
          {order.status === 'completed' && (
            <Button variant="outline" onClick={() => setShowRating(true)}>
              评价对方
            </Button>
          )}
        </div>
      </div>

      {/* 评价弹窗 */}
      {showRating && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40" onClick={() => setShowRating(false)}>
          <div className="w-full max-w-2xl rounded-t-2xl bg-background p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold">评价对方</h3>
            <div className="mb-4 flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <button key={i} onClick={() => setRatingScore(i + 1)}>
                  <Star className={`h-8 w-8 stroke-[2] ${i < ratingScore ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                </button>
              ))}
            </div>
            <textarea
              value={ratingContent}
              onChange={(e) => setRatingContent(e.target.value)}
              placeholder="写下你的评价（选填）"
              className="mb-4 w-full rounded-xl border bg-muted/30 px-4 py-3 text-sm outline-none focus:border-primary"
              rows={3}
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowRating(false)}>取消</Button>
              <Button className="flex-1" onClick={handleSubmitRating} disabled={submitting}>
                {submitting ? '提交中...' : '提交评价'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 支付弹窗 */}
      {order && (
        <PaymentDialog
          open={showPayment}
          onClose={() => setShowPayment(false)}
          orderNo={order.order_no}
          amount={order.pay_amount}
          onConfirm={handlePaymentConfirm}
        />
      )}

      {/* 退款弹窗 */}
      {order && (
        <RefundDialog
          open={showRefund}
          onClose={() => setShowRefund(false)}
          orderId={order.id}
          onSuccess={async () => {
            toast.success('退款申请已提交')
            const res = await fetch(`/api/orders/${order.id}`)
            if (res.ok) {
              const { data } = await res.json()
              setOrder(data)
            }
          }}
        />
      )}

      {/* 发货弹窗 */}
      {showShipDialog && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40" onClick={() => setShowShipDialog(false)}>
          <div className="w-full max-w-2xl rounded-t-2xl bg-background p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold">确认发货</h3>
            <div className="mb-3">
              <label className="mb-1.5 block text-sm font-medium">物流公司</label>
              <div className="flex flex-wrap gap-2">
                {logisticsCompanies.map((company) => (
                  <button
                    key={company}
                    onClick={() => setShipCompany(company)}
                    className={`rounded-lg border px-3 py-1.5 text-sm ${
                      shipCompany === company
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted bg-background hover:bg-muted'
                    }`}
                  >
                    {company}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium">物流单号</label>
              <input
                value={shipNo}
                onChange={(e) => setShipNo(e.target.value)}
                placeholder="请输入快递单号"
                className="w-full rounded-xl border bg-muted/30 px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowShipDialog(false)}>取消</Button>
              <Button className="flex-1" onClick={handleShip} disabled={updateStatus.isPending}>
                {updateStatus.isPending ? '提交中...' : '确认发货'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
