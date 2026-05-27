'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BackHeader } from '@/components/common/back-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { useAuth } from '@/lib/hooks/use-auth'
import { formatPrice } from '@/lib/format'
import { DollarSign, TrendingUp, Clock, Wallet, ArrowDownToLine, Percent } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface FinanceData {
  total_sales: number
  total_commission: number
  total_earnings: number
  today_sales: number
  today_commission: number
  pending_amount: number
  total_withdrawn: number
  available_balance: number
  completed_orders: number
  pending_orders: number
  daily_trend: Array<{ date: string; sales: number; commission: number; earnings: number }>
}

interface Withdrawal {
  id: string
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

const withdrawalStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '审核中', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '已打款', color: 'bg-green-100 text-green-700' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
}

export default function SellerFinancePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'seller' && user.role !== 'merchant' && user.role !== 'admin'))) {
      router.replace('/profile')
    }
  }, [user, authLoading, router])

  const fetchData = useCallback(async () => {
    try {
      const [financeRes, withdrawalRes] = await Promise.all([
        fetch('/api/seller/finance'),
        fetch('/api/seller/finance?type=withdrawals'),
      ])
      if (financeRes.ok) {
        const financeData = await financeRes.json()
        setData(financeData)
      }
      if (withdrawalRes.ok) {
        const wd = await withdrawalRes.json()
        setWithdrawals(wd.data || [])
      }
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount)
    if (!amount || amount <= 0) {
      toast.error('请输入有效金额')
      return
    }
    if (data && amount > data.available_balance) {
      toast.error('超出可用余额')
      return
    }
    setWithdrawing(true)
    try {
      const res = await fetch('/api/seller/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      const result = await res.json()
      if (res.ok) {
        toast.success('提现申请已提交')
        setWithdrawAmount('')
        setShowWithdraw(false)
        fetchData()
      } else {
        toast.error(result.error || '申请失败')
      }
    } catch {
      toast.error('申请失败')
    } finally {
      setWithdrawing(false)
    }
  }

  if (authLoading || loading) return <LoadingSpinner text="加载中..." />
  if (!user || !data) return null

  const cards = [
    { label: '总销售额', value: data.total_sales, icon: DollarSign, color: 'text-blue-500 bg-blue-50' },
    { label: '平台提成', value: data.total_commission, icon: Percent, color: 'text-red-500 bg-red-50' },
    { label: '实际收入', value: data.total_earnings, icon: TrendingUp, color: 'text-green-500 bg-green-50' },
    { label: '可用余额', value: data.available_balance, icon: Wallet, color: 'text-purple-500 bg-purple-50' },
  ]

  return (
    <div>
      <BackHeader title="我的账单" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* 数据卡片 */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label} className="rounded-2xl border bg-card p-4">
                <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${card.color}`}>
                  <Icon className={`h-4 w-4 stroke-[1.8] ${card.color.split(' ')[0]}`} />
                </div>
                <p className="text-xl font-bold">{formatPrice(card.value)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{card.label}</p>
              </div>
            )
          })}
        </div>

        {/* 今日数据 */}
        <div className="mb-4 rounded-2xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">今日数据</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-lg font-bold">{formatPrice(data.today_sales)}</p>
              <p className="text-xs text-muted-foreground">销售额</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-500">{formatPrice(data.today_commission)}</p>
              <p className="text-xs text-muted-foreground">提成</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-500">{formatPrice(data.today_sales - data.today_commission)}</p>
              <p className="text-xs text-muted-foreground">收入</p>
            </div>
          </div>
        </div>

        {/* 待结算 & 提现 */}
        <div className="mb-4 rounded-2xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">待结算</p>
              <p className="text-lg font-bold">{formatPrice(data.pending_amount)}</p>
              <p className="text-xs text-muted-foreground">{data.pending_orders} 笔进行中订单</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">可提现</p>
              <p className="text-lg font-bold text-green-600">{formatPrice(data.available_balance)}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-1 rounded-full text-xs"
                onClick={() => setShowWithdraw(!showWithdraw)}
                disabled={data.available_balance <= 0}
              >
                <ArrowDownToLine className="mr-1 h-3 w-3" />
                提现
              </Button>
            </div>
          </div>
          {showWithdraw && (
            <div className="mt-4 flex gap-2 border-t pt-4">
              <Input
                type="number"
                placeholder="提现金额"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                max={data.available_balance}
                className="flex-1"
              />
              <Button onClick={handleWithdraw} disabled={withdrawing} size="sm">
                {withdrawing ? '提交中...' : '确认'}
              </Button>
            </div>
          )}
        </div>

        {/* 近7天趋势 */}
        <div className="mb-4 rounded-2xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">近7天收入</h3>
          <div className="flex items-end gap-1.5 h-32">
            {(data.daily_trend || []).map((day) => {
              const maxVal = Math.max(...(data.daily_trend || []).map((d) => d.earnings), 1)
              const height = maxVal > 0 ? Math.max((day.earnings / maxVal) * 100, 4) : 4
              const weekday = new Date(day.date).toLocaleDateString('zh-CN', { weekday: 'short' })
              return (
                <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[9px] text-muted-foreground">{day.earnings > 0 ? formatPrice(day.earnings) : ''}</span>
                  <div className="w-full rounded-t-md bg-green-100" style={{ height: `${height}%` }}>
                    <div className="w-full h-full rounded-t-md bg-green-500/60" />
                  </div>
                  <span className="text-[9px] text-muted-foreground">{weekday}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 提现记录 */}
        <div className="rounded-2xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">提现记录</h3>
          {withdrawals.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无提现记录</p>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w) => {
                const status = withdrawalStatusMap[w.status] || { label: w.status, color: '' }
                return (
                  <div key={w.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{formatPrice(w.amount)}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {new Date(w.created_at).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
