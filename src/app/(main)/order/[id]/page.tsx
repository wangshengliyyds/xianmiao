'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useOrder, useUpdateOrderStatus } from '@/lib/hooks/use-order'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { RatingDialog } from '@/components/common/rating-dialog'
import { RefundDialog } from '@/components/common/refund-dialog'
import {
  ChevronLeft, Package, MapPin, Truck, Shield,
  Clock, CheckCircle, XCircle, CircleDot, Loader2, MessageCircle,
} from 'lucide-react'
import { formatPrice, formatDate, formatRelativeTime } from '@/lib/format'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/types/order'
import { cn } from '@/lib/utils'

// 状态流程线
const STATUS_FLOW: OrderStatus[] = ['pending_pay', 'paid', 'shipped', 'delivered', 'completed']
const STATUS_ICONS: Record<string, typeof Clock> = {
  pending_pay: Clock,
  paid: Shield,
  shipped: Truck,
  delivered: Package,
  completed: CheckCircle,
  cancelled: XCircle,
  refunding: CircleDot,
  refunded: CheckCircle,
  disputed: XCircle,
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: order, isLoading } = useOrder(params.id as string)
  const updateStatus = useUpdateOrderStatus()
  const [logisticsNo, setLogisticsNo] = useState('')
  const [logisticsCompany, setLogisticsCompany] = useState('')

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="space-y-3 p-4">
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
          <div className="h-20 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">订单不存在</p>
        <Button variant="link" onClick={() => router.push('/order')}>返回订单列表</Button>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const isBuyer = order.buyer_id === user.id
  const isSeller = order.seller_id === user.id
  const counterparty = isBuyer ? order.seller : order.buyer
  const coverImage = order.product?.images?.find((img) => img.is_cover) || order.product?.images?.[0]

  const currentStatusIndex = STATUS_FLOW.indexOf(order.status)
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded' || order.status === 'disputed'

  // 操作函数
  const handlePay = () => {
    // TODO: 集成支付
    updateStatus.mutate(
      { orderId: order.id, status: 'paid', remark: '模拟支付成功' },
      {
        onSuccess: () => toast.success('支付成功（模拟）'),
        onError: () => toast.error('支付失败'),
      }
    )
  }

  const handleShip = () => {
    if (!logisticsCompany || !logisticsNo) {
      toast.error('请填写物流信息')
      return
    }
    updateStatus.mutate(
      { orderId: order.id, status: 'shipped', remark: `${logisticsCompany}: ${logisticsNo}` },
      {
        onSuccess: () => toast.success('已发货'),
        onError: () => toast.error('发货失败'),
      }
    )
  }

  const handleConfirmReceipt = () => {
    updateStatus.mutate(
      { orderId: order.id, status: 'completed', remark: '买家确认收货' },
      {
        onSuccess: () => toast.success('已确认收货'),
        onError: () => toast.error('操作失败'),
      }
    )
  }

  const handleCancel = () => {
    updateStatus.mutate(
      { orderId: order.id, status: 'cancelled', remark: isBuyer ? '买家取消订单' : '卖家取消订单' },
      {
        onSuccess: () => toast.success('订单已取消'),
        onError: () => toast.error('操作失败'),
      }
    )
  }

  return (
    <div className="mx-auto max-w-2xl pb-24">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b bg-background px-4 py-3">
        <button onClick={() => router.back()} className="p-1">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">订单详情</h1>
      </div>

      {/* 状态流程 */}
      <div className="border-b bg-gradient-to-r from-primary/5 to-transparent px-4 py-4">
        <div className="flex items-center gap-2">
          {(() => {
            const Icon = STATUS_ICONS[order.status] || Clock
            return <Icon className="h-5 w-5 text-primary" />
          })()}
          <span className="text-lg font-semibold text-primary">
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>

        {/* 流程步骤 */}
        {!isCancelled && (
          <div className="mt-4 flex items-center gap-1">
            {STATUS_FLOW.map((status, index) => {
              const isDone = index <= currentStatusIndex
              const isCurrent = index === currentStatusIndex
              return (
                <div key={status} className="flex flex-1 items-center">
                  <div
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                      isDone ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                      isCurrent && 'ring-2 ring-primary/30'
                    )}
                  >
                    {index + 1}
                  </div>
                  {index < STATUS_FLOW.length - 1 && (
                    <div className={cn('mx-1 h-0.5 flex-1', isDone ? 'bg-primary' : 'bg-muted')} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {order.auto_confirm_at && order.status === 'shipped' && (
          <p className="mt-2 text-xs text-muted-foreground">
            超过 {formatDate(order.auto_confirm_at)} 将自动确认收货
          </p>
        )}
      </div>

      {/* 收货地址 */}
      {order.address_snapshot && (
        <div className="flex items-start gap-3 border-b px-4 py-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">{(order.address_snapshot as Record<string, unknown>).name as string}</span>
              <span className="text-muted-foreground">{(order.address_snapshot as Record<string, unknown>).phone as string}</span>
            </div>
            <p className="mt-0.5 text-muted-foreground">
              {(order.address_snapshot as Record<string, unknown>).province as string}
              {(order.address_snapshot as Record<string, unknown>).city as string}
              {(order.address_snapshot as Record<string, unknown>).district as string}
              {(order.address_snapshot as Record<string, unknown>).detail as string}
            </p>
          </div>
        </div>
      )}

      {/* 商品信息 */}
      <div className="flex gap-3 border-b px-4 py-3">
        <Link href={`/product/${order.product?.id}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
          {coverImage ? (
            <Image src={coverImage.url} alt="" fill className="object-cover" sizes="80px" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium">{order.product?.title}</p>
          <p className="mt-1 text-lg font-bold text-primary">{formatPrice(Number(order.unit_price))}</p>
          <p className="text-xs text-muted-foreground">x {order.quantity}</p>
        </div>
      </div>

      {/* 交易对方 */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {isBuyer ? '卖家' : '买家'}
            </p>
            <p className="font-medium">{counterparty?.nickname || '未知'}</p>
          </div>
          <Link href="/chat">
            <Button variant="outline" size="sm">
              <MessageCircle className="mr-1 h-3 w-3" />
              联系TA
            </Button>
          </Link>
        </div>
      </div>

      {/* 价格明细 */}
      <div className="space-y-2 border-b px-4 py-3">
        <h3 className="text-sm font-medium">价格明细</h3>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">商品单价</span>
          <span>{formatPrice(Number(order.unit_price))}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">数量</span>
          <span>x {order.quantity}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">商品总价</span>
          <span>{formatPrice(Number(order.total_amount))}</span>
        </div>
        {Number(order.shipping_fee) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">运费</span>
            <span>{formatPrice(Number(order.shipping_fee))}</span>
          </div>
        )}
        {Number(order.discount_amount) > 0 && (
          <div className="flex justify-between text-sm text-primary">
            <span>优惠</span>
            <span>-{formatPrice(Number(order.discount_amount))}</span>
          </div>
        )}
        <div className="flex justify-between border-t pt-2 font-medium">
          <span>实付金额</span>
          <span className="text-primary">{formatPrice(Number(order.pay_amount))}</span>
        </div>
      </div>

      {/* 订单信息 */}
      <div className="space-y-2 border-b px-4 py-3">
        <h3 className="text-sm font-medium">订单信息</h3>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">订单编号</span>
          <span>{order.order_no}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">交易方式</span>
          <span>{order.trade_method === 'escrow' ? '平台担保' : '同城自提'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">创建时间</span>
          <span>{formatDate(order.created_at)}</span>
        </div>
        {order.logistics_company && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">物流信息</span>
            <span>{order.logistics_company} {order.logistics_no}</span>
          </div>
        )}
      </div>

      {/* 卖家发货表单 */}
      {isSeller && order.status === 'paid' && (
        <div className="border-b px-4 py-3">
          <h3 className="mb-3 text-sm font-medium">填写物流信息</h3>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="快递公司（如：顺丰、圆通）"
              value={logisticsCompany}
              onChange={(e) => setLogisticsCompany(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="运单号"
              value={logisticsNo}
              onChange={(e) => setLogisticsNo(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            <Button onClick={handleShip} className="w-full" disabled={updateStatus.isPending}>
              {updateStatus.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认发货
            </Button>
          </div>
        </div>
      )}

      {/* 备注 */}
      {order.remark && (
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-medium">备注</h3>
          <p className="mt-1 text-sm text-muted-foreground">{order.remark}</p>
        </div>
      )}

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background safe-bottom md:relative md:border-0">
        <div className="mx-auto flex max-w-2xl items-center justify-end gap-2 px-4 py-3">
          {isBuyer && order.status === 'pending_pay' && (
            <>
              <Button variant="outline" onClick={handleCancel}>取消订单</Button>
              <Button onClick={handlePay} disabled={updateStatus.isPending}>
                {updateStatus.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                立即付款
              </Button>
            </>
          )}

          {isBuyer && order.status === 'shipped' && (
            <>
              <RefundDialog orderId={order.id} />
              <Button onClick={handleConfirmReceipt} disabled={updateStatus.isPending}>
                {updateStatus.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                确认收货
              </Button>
            </>
          )}

          {isBuyer && order.status === 'paid' && (
            <RefundDialog orderId={order.id} />
          )}

          {isBuyer && (order.status === 'completed' || order.status === 'delivered') && order.seller && (
            <RatingDialog
              orderId={order.id}
              rateeId={order.seller.id}
              rateeName={order.seller.nickname || '卖家'}
            />
          )}

          {isSeller && (order.status === 'completed' || order.status === 'delivered') && order.buyer && (
            <RatingDialog
              orderId={order.id}
              rateeId={order.buyer.id}
              rateeName={order.buyer.nickname || '买家'}
            />
          )}

          {isSeller && order.status === 'pending_pay' && (
            <Button variant="outline" onClick={handleCancel}>取消订单</Button>
          )}

          {isSeller && order.status === 'refunding' && (
            <>
              <Button
                variant="outline"
                onClick={() => updateStatus.mutate(
                  { orderId: order.id, status: 'paid', remark: '卖家拒绝退款' },
                  { onSuccess: () => toast.success('已拒绝退款'), onError: () => toast.error('操作失败') }
                )}
              >
                拒绝退款
              </Button>
              <Button
                onClick={() => updateStatus.mutate(
                  { orderId: order.id, status: 'refunded', remark: '卖家同意退款' },
                  { onSuccess: () => toast.success('已同意退款'), onError: () => toast.error('操作失败') }
                )}
              >
                同意退款
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
