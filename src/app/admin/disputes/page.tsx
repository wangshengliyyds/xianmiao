'use client'

import { useEffect, useState } from 'react'
import { Search, MessageSquare } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatRelativeTime } from '@/lib/format'
import { toast } from 'sonner'

interface DisputeOrder {
  id: string
  order_no: string
  status: string
  pay_amount: number
  created_at: string
  product?: { title: string }
  buyer?: { nickname: string }
  seller?: { nickname: string }
}

const statusLabels: Record<string, string> = {
  refunding: '退款中', refunded: '已退款', disputed: '争议中',
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/disputes?page=1&page_size=100')
      .then((res) => res.ok ? res.json() : { data: [] })
      .then(({ data }) => setDisputes(data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = disputes.filter((d) =>
    d.order_no.includes(search) || d.product?.title?.includes(search)
  )

  const handleAction = async (orderId: string, action: string) => {
    const labels: Record<string, string> = { resolve: '解决', refund: '退款', reject: '驳回' }
    if (!window.confirm(`确定要${labels[action] || action}该纠纷吗？`)) return
    try {
      const res = await fetch('/api/admin/disputes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, action }),
      })
      if (res.ok) {
        setDisputes((prev) => prev.filter((d) => d.id !== orderId))
        toast.success(action === 'resolve' ? '已解决' : action === 'refund' ? '已退款' : '已驳回')
      }
    } catch {
      toast.error('操作失败')
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">交易纠纷</h1>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="搜索订单号..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <span className="text-sm text-muted-foreground">共 {filtered.length} 条</span>
      </div>

      <div className="rounded-2xl border bg-card admin-table-wrap overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">订单号</th>
              <th className="px-4 py-3 text-left font-medium">商品</th>
              <th className="px-4 py-3 text-left font-medium">买家/卖家</th>
              <th className="px-4 py-3 text-left font-medium">金额</th>
              <th className="px-4 py-3 text-left font-medium">状态</th>
              <th className="px-4 py-3 text-left font-medium">时间</th>
              <th className="px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">加载中...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                暂无纠纷
              </td></tr>
            ) : (
              filtered.map((d) => (
                <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{d.order_no}</td>
                  <td className="px-4 py-3">{d.product?.title || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {d.buyer?.nickname || '—'} → {d.seller?.nickname || '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-primary">{formatPrice(d.pay_amount)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={d.status === 'disputed' ? 'destructive' : 'secondary'}>
                      {statusLabels[d.status] || d.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatRelativeTime(d.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" className="text-green-600" onClick={() => handleAction(d.id, 'resolve')}>解决</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleAction(d.id, 'refund')}>退款</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleAction(d.id, 'reject')}>驳回</Button>
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
