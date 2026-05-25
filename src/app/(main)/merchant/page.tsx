'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Store, CheckCircle, Clock, XCircle, Loader2, Package, ShoppingCart, DollarSign, Plus } from 'lucide-react'
import { formatPrice } from '@/lib/format'
import { BackHeader } from '@/components/common/back-header'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/hooks/use-auth'
import { toast } from 'sonner'
import type { MerchantProfile } from '@/types'

const statusConfig = {
  pending: { label: '审核中', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  approved: { label: '已通过', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  rejected: { label: '已拒绝', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  suspended: { label: '已停用', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
}

export default function MerchantPage() {
  const { user, loading: authLoading } = useAuth()
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [shopName, setShopName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [dashboard, setDashboard] = useState({ products: 0, orders: 0, revenue: 0 })

  useEffect(() => {
    if (!user) return
    fetch('/api/merchant')
      .then((res) => res.ok ? res.json() : { data: null })
      .then(({ data }) => {
        setMerchant(data)
        if (data?.shop_name) setShopName(data.shop_name)
        if (data?.status === 'approved') {
          fetchDashboard()
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const fetchDashboard = async () => {
    try {
      const [prodRes, orderRes] = await Promise.all([
        fetch(`/api/products?seller_id=${user!.id}&page_size=1`),
        fetch('/api/orders?role=seller&page_size=100'),
      ])
      const [prodData, orderData] = await Promise.all([
        prodRes.ok ? prodRes.json() : { total: 0 },
        orderRes.ok ? orderRes.json() : { data: [], total: 0 },
      ])
      const orders = orderData.data || []
      const revenue = orders.filter((o: { status: string }) => o.status === 'completed').reduce((s: number, o: { pay_amount?: number }) => s + (o.pay_amount || 0), 0)
      setDashboard({ products: prodData.total || 0, orders: orderData.total || 0, revenue })
    } catch {}
  }

  const handleSubmit = async () => {
    if (!shopName.trim()) {
      toast.error('请输入店铺名称')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/merchant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop_name: shopName.trim() }),
      })
      if (res.ok) {
        const { data } = await res.json()
        setMerchant(data)
        toast.success('申请已提交，请等待审核')
      } else {
        const err = await res.json()
        toast.error(err.error || '提交失败')
      }
    } catch {
      toast.error('提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) return <LoadingSpinner text="加载中..." />

  if (!user) {
    return (
      <div>
        <BackHeader title="商家中心" />
        <EmptyState icon={<Store className="h-8 w-8 stroke-[2] text-muted-foreground/40" />} title="请先登录" description="登录后即可申请成为商家" />
      </div>
    )
  }

  return (
    <div>
      <BackHeader title="商家中心" />

      <div className="mx-auto max-w-2xl px-4 py-6">
        {merchant ? (
          <div className="space-y-6">
            {/* 状态卡片 */}
            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${statusConfig[merchant.status].bg}`}>
                  {(() => {
                    const Icon = statusConfig[merchant.status].icon
                    return <Icon className={`h-6 w-6 stroke-[2] ${statusConfig[merchant.status].color}`} />
                  })()}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{merchant.shop_name}</h2>
                  <Badge variant={merchant.status === 'approved' ? 'default' : merchant.status === 'pending' ? 'secondary' : 'destructive'}>
                    {statusConfig[merchant.status].label}
                  </Badge>
                </div>
              </div>

              {merchant.status === 'approved' && (
                <div className="mt-4 rounded-xl bg-green-50 p-4">
                  <p className="text-sm text-green-700">恭喜！你的商家申请已通过，现在可以发布商品进行交易了。</p>
                </div>
              )}

              {merchant.status === 'approved' && (
                <>
                  {/* 数据概览 */}
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <Link href="/profile/products" className="rounded-xl bg-muted/50 p-3 text-center transition-colors hover:bg-muted">
                      <Package className="mx-auto h-5 w-5 text-primary" />
                      <p className="mt-1 text-lg font-bold">{dashboard.products}</p>
                      <p className="text-[10px] text-muted-foreground">在售商品</p>
                    </Link>
                    <Link href="/order?role=seller" className="rounded-xl bg-muted/50 p-3 text-center transition-colors hover:bg-muted">
                      <ShoppingCart className="mx-auto h-5 w-5 text-primary" />
                      <p className="mt-1 text-lg font-bold">{dashboard.orders}</p>
                      <p className="text-[10px] text-muted-foreground">收到订单</p>
                    </Link>
                    <div className="rounded-xl bg-muted/50 p-3 text-center">
                      <DollarSign className="mx-auto h-5 w-5 text-green-600" />
                      <p className="mt-1 text-lg font-bold">{formatPrice(dashboard.revenue)}</p>
                      <p className="text-[10px] text-muted-foreground">累计收入</p>
                    </div>
                  </div>

                  {/* 快捷操作 */}
                  <div className="mt-4 flex gap-2">
                    <Link href="/product/publish" className="flex-1">
                      <Button variant="outline" className="w-full gap-1">
                        <Plus className="h-4 w-4" />
                        发布商品
                      </Button>
                    </Link>
                    <Link href="/profile/products" className="flex-1">
                      <Button variant="outline" className="w-full gap-1">
                        <Package className="h-4 w-4" />
                        管理商品
                      </Button>
                    </Link>
                  </div>
                </>
              )}
              {merchant.status === 'pending' && (
                <div className="mt-4 rounded-xl bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-700">你的商家申请正在审核中，请耐心等待。</p>
                </div>
              )}
              {merchant.status === 'rejected' && (
                <div className="mt-4 rounded-xl bg-red-50 p-4">
                  <p className="text-sm text-red-700">你的商家申请未通过审核，可以重新提交申请。</p>
                </div>
              )}
              {merchant.status === 'suspended' && (
                <div className="mt-4 rounded-xl bg-orange-50 p-4">
                  <p className="text-sm text-orange-700">你的商家账号已被暂停，请联系客服了解详情。</p>
                </div>
              )}
            </div>

            {/* 店铺信息 */}
            <div className="rounded-2xl border bg-card p-6 space-y-3">
              <h3 className="text-sm font-semibold">店铺信息</h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">店铺名称</span>
                <span className="font-medium">{merchant.shop_name}</span>
              </div>
              {merchant.deposit_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">保证金</span>
                  <span className="font-medium">{formatPrice(merchant.deposit_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">申请时间</span>
                <span>{new Date(merchant.created_at).toLocaleDateString()}</span>
              </div>
              {merchant.approved_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">通过时间</span>
                  <span>{new Date(merchant.approved_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <EmptyState
              icon={<Store className="h-8 w-8 stroke-[2] text-muted-foreground/40" />}
              title="成为商家"
              description="申请成为闲妙商家，解锁更多交易功能"
            />

            <div className="rounded-2xl border bg-card p-6">
              <h3 className="mb-4 text-sm font-semibold">商家申请</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">店铺名称 *</Label>
                  <Input value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="请输入你的店铺名称" maxLength={30} />
                </div>
                <div className="rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground space-y-1">
                  <p>成为商家后你可以：</p>
                  <p>- 发布更多商品</p>
                  <p>- 拥有专属店铺页面</p>
                  <p>- 使用更多高级功能</p>
                </div>
                <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />提交中...</> : '提交申请'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
