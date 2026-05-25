'use client'

import { useEffect, useState } from 'react'
import { Search, Eye, XCircle, RotateCcw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatRelativeTime } from '@/lib/format'
import { ORDER_STATUS } from '@/lib/constants'
import { toast } from 'sonner'
import type { OrderWithDetails } from '@/types'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), page_size: '20' })
    if (statusFilter) params.set('status', statusFilter)
    if (search) params.set('search', search)
    fetch(`/api/admin/orders?${params}`)
      .then((res) => res.ok ? res.json() : { data: [] })
      .then((res) => {
        setOrders(res.data || [])
        setHasMore(res.has_more || false)
        setTotal(res.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, statusFilter, search])

  const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending_pay: 'default', paid: 'secondary', shipped: 'secondary', delivered: 'secondary',
    completed: 'outline', cancelled: 'destructive', refunding: 'destructive', refunded: 'destructive', disputed: 'destructive',
  }

  const handleAction = async (id: string, action: 'cancel' | 'refund') => {
    const label = action === 'cancel' ? '取消' : '退款'
    if (!window.confirm(`确定要${label}该订单吗？`)) return
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      if (res.ok) {
        const newStatus = action === 'cancel' ? 'cancelled' : 'refunded'
        setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: newStatus } : o))
        toast.success(action === 'cancel' ? '已取消订单' : '已退款')
      } else {
        toast.error('操作失败')
      }
    } catch {
      toast.error('操作失败')
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">订单管理</h1>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="搜索订单号..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="">全部状态</option>
          {Object.entries(ORDER_STATUS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground">共 {total} 单</span>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>上一页</Button>
          <span className="flex items-center text-sm text-muted-foreground">第 {page} 页</span>
          <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>下一页</Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">订单号</th>
              <th className="px-4 py-3 text-left font-medium">买家</th>
              <th className="px-4 py-3 text-left font-medium">卖家</th>
              <th className="px-4 py-3 text-left font-medium">金额</th>
              <th className="px-4 py-3 text-left font-medium">状态</th>
              <th className="px-4 py-3 text-left font-medium">创建时间</th>
              <th className="px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">加载中...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">暂无数据</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{order.order_no}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {(order.buyer as { nickname?: string })?.nickname || '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {(order.seller as { nickname?: string })?.nickname || '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-primary">{formatPrice(order.pay_amount)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[order.status] || 'outline'}>
                      {ORDER_STATUS[order.status] || order.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatRelativeTime(order.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <a href={`/order/${order.id}`} target="_blank" className="inline-flex items-center justify-center rounded-lg p-2 text-sm hover:bg-muted">
                        <Eye className="h-4 w-4" />
                      </a>
                      {!['cancelled', 'completed', 'refunded'].includes(order.status) && (
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleAction(order.id, 'cancel')}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {['paid', 'shipped', 'delivered'].includes(order.status) && (
                        <Button variant="ghost" size="sm" onClick={() => handleAction(order.id, 'refund')}>
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
