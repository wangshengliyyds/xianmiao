'use client'

import { useEffect, useState, useCallback } from 'react'
import { DollarSign, TrendingUp, ShoppingCart, BarChart3, Percent, Users, Store } from 'lucide-react'
import { formatPrice } from '@/lib/format'

interface DailyTrend {
  date: string
  revenue: number
  commission: number
  orders: number
}

interface FinanceStats {
  total_revenue: number
  today_revenue: number
  total_commission: number
  today_commission: number
  total_orders: number
  today_orders: number
  completed_orders: number
  avg_order_amount: number
  daily_trend: DailyTrend[]
}

interface Withdrawal {
  id: string
  seller_id: string
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  seller?: { id: string; nickname: string; avatar_url: string | null }
}

interface SellerRow {
  id: string
  nickname: string
  avatar_url: string | null
  total_sales: number
  total_commission: number
  order_count: number
}

interface BuyerRow {
  id: string
  nickname: string
  avatar_url: string | null
  total_spent: number
  order_count: number
}

const statusMap: Record<string, string> = {
  pending: '待处理',
  approved: '已打款',
  rejected: '已拒绝',
}

export default function AdminFinancePage() {
  const [stats, setStats] = useState<FinanceStats>({
    total_revenue: 0, today_revenue: 0, total_commission: 0, today_commission: 0,
    total_orders: 0, today_orders: 0, completed_orders: 0, avg_order_amount: 0, daily_trend: [],
  })
  const [loading, setLoading] = useState(true)
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true)
  const [sellers, setSellers] = useState<SellerRow[]>([])
  const [buyers, setBuyers] = useState<BuyerRow[]>([])
  const [commissionLoading, setCommissionLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/finance')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data) setStats(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const fetchWithdrawals = useCallback(() => {
    setWithdrawalsLoading(true)
    fetch('/api/admin/finance?type=withdrawals')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data?.data) setWithdrawals(data.data) })
      .catch(() => {})
      .finally(() => setWithdrawalsLoading(false))
  }, [])

  useEffect(() => { fetchWithdrawals() }, [fetchWithdrawals])

  useEffect(() => {
    fetch('/api/admin/finance?type=commissions')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          setSellers(data.sellers || [])
          setBuyers(data.buyers || [])
        }
      })
      .catch(() => {})
      .finally(() => setCommissionLoading(false))
  }, [])

  const handleWithdrawalAction = async (id: string, action: 'approve' | 'reject') => {
    const label = action === 'approve' ? '打款' : '拒绝'
    if (!window.confirm(`确定要${label}该提现申请吗？`)) return
    try {
      const res = await fetch('/api/admin/finance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawal_id: id, action }),
      })
      if (res.ok) fetchWithdrawals()
    } catch {}
  }

  const cards = [
    { label: '总交易额', value: stats.total_revenue, icon: DollarSign, color: 'text-green-500 bg-green-50' },
    { label: '总提成收入', value: stats.total_commission, icon: Percent, color: 'text-emerald-500 bg-emerald-50' },
    { label: '今日交易额', value: stats.today_revenue, icon: TrendingUp, color: 'text-blue-500 bg-blue-50' },
    { label: '今日提成', value: stats.today_commission, icon: BarChart3, color: 'text-purple-500 bg-purple-50' },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">财务中心</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-2xl border bg-card p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}>
                  <Icon className="h-5 w-5 stroke-[1.8]" />
                </div>
              </div>
              <p className="text-2xl font-bold">{loading ? '—' : formatPrice(card.value)}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{card.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">交易概览</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">总订单</span>
              <span className="font-medium">{loading ? '—' : stats.total_orders}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">已完成</span>
              <span className="font-medium">{loading ? '—' : stats.completed_orders}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">平均客单价</span>
              <span className="font-medium">{loading ? '—' : formatPrice(stats.avg_order_amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">完成率</span>
              <span className="font-medium">
                {loading ? '—' : stats.total_orders > 0 ? `${Math.round(stats.completed_orders / stats.total_orders * 100)}%` : '0%'}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">收入趋势（近7天）</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">加载中...</p>
          ) : (
            <div className="flex items-end gap-2 h-40">
              {stats.daily_trend.map((day) => {
                const maxRevenue = Math.max(...stats.daily_trend.map((d) => d.revenue), 1)
                const height = maxRevenue > 0 ? Math.max((day.revenue / maxRevenue) * 100, 4) : 4
                const weekday = new Date(day.date).toLocaleDateString('zh-CN', { weekday: 'short' })
                return (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">{day.revenue > 0 ? formatPrice(day.revenue) : ''}</span>
                    <div className="w-full rounded-t-md bg-primary/20 transition-all" style={{ height: `${height}%` }}>
                      <div className="w-full h-full rounded-t-md bg-primary/60" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{weekday}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 卖家提成排行 */}
      <div className="mt-6 rounded-2xl border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Store className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">卖家提成明细</h2>
        </div>
        {commissionLoading ? (
          <p className="text-sm text-muted-foreground">加载中...</p>
        ) : sellers.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无数据</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">卖家</th>
                  <th className="pb-2 pr-4 font-medium">成交额</th>
                  <th className="pb-2 pr-4 font-medium">平台提成</th>
                  <th className="pb-2 pr-4 font-medium">订单数</th>
                  <th className="pb-2 font-medium">提成比例</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{s.nickname}</td>
                    <td className="py-3 pr-4">{formatPrice(s.total_sales)}</td>
                    <td className="py-3 pr-4 text-green-600 font-medium">{formatPrice(s.total_commission)}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{s.order_count}</td>
                    <td className="py-3 text-muted-foreground">
                      {s.total_sales > 0 ? `${(s.total_commission / s.total_sales * 100).toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 买家消费排行 */}
      <div className="mt-6 rounded-2xl border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">买家消费排行</h2>
        </div>
        {commissionLoading ? (
          <p className="text-sm text-muted-foreground">加载中...</p>
        ) : buyers.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无数据</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">买家</th>
                  <th className="pb-2 pr-4 font-medium">消费总额</th>
                  <th className="pb-2 font-medium">订单数</th>
                </tr>
              </thead>
              <tbody>
                {buyers.map((b) => (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{b.nickname}</td>
                    <td className="py-3 pr-4">{formatPrice(b.total_spent)}</td>
                    <td className="py-3 text-muted-foreground">{b.order_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 提现管理 */}
      <div className="mt-6 rounded-2xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">提现管理</h2>
        {withdrawalsLoading ? (
          <p className="text-sm text-muted-foreground">加载中...</p>
        ) : withdrawals.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无提现申请</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">商家</th>
                  <th className="pb-2 pr-4 font-medium">金额</th>
                  <th className="pb-2 pr-4 font-medium">状态</th>
                  <th className="pb-2 pr-4 font-medium">申请时间</th>
                  <th className="pb-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b last:border-0">
                    <td className="py-3 pr-4">{w.seller?.nickname || w.seller_id.slice(0, 8)}</td>
                    <td className="py-3 pr-4">{formatPrice(w.amount)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                        w.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                          : w.status === 'approved' ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {statusMap[w.status] || w.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {new Date(w.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="py-3">
                      {w.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleWithdrawalAction(w.id, 'approve')} className="rounded-md bg-green-500 px-3 py-1 text-xs text-white hover:bg-green-600">打款</button>
                          <button onClick={() => handleWithdrawalAction(w.id, 'reject')} className="rounded-md bg-red-500 px-3 py-1 text-xs text-white hover:bg-red-600">拒绝</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
