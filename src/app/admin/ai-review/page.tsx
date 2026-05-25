'use client'

import { useEffect, useState } from 'react'
import { Bot, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/format'
import { toast } from 'sonner'

interface ReviewItem {
  id: string
  title: string
  status: string
  price: number
  created_at: string
  seller?: { nickname: string }
}

export default function AdminAiReviewPage() {
  const [items, setItems] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [todayApproved, setTodayApproved] = useState(0)
  const [todayRejected, setTodayRejected] = useState(0)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/products?status=draft&page=1&page_size=50').then((r) => r.ok ? r.json() : { data: [] }),
      fetch('/api/admin/stats?type=review').then((r) => r.ok ? r.json() : { today_approved: 0, today_rejected: 0 }),
    ]).then(([productsRes, statsRes]) => {
      setItems(productsRes.data || [])
      setTodayApproved(statsRes.today_approved || 0)
      setTodayRejected(statsRes.today_rejected || 0)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const refreshStats = async () => {
    try {
      const res = await fetch('/api/admin/stats?type=review')
      if (res.ok) {
        const stats = await res.json()
        setTodayApproved(stats.today_approved || 0)
        setTodayRejected(stats.today_rejected || 0)
      }
    } catch {}
  }

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      })
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id))
        refreshStats()
        toast.success('已通过上架')
      }
    } catch {
      toast.error('操作失败')
    }
  }

  const handleReject = async (id: string) => {
    if (!window.confirm('确定要拒绝该商品吗？')) return
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'removed' }),
      })
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id))
        refreshStats()
        toast.success('已拒绝')
      }
    } catch {
      toast.error('操作失败')
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">AI审核</h1>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-yellow-600">
            <Clock className="h-5 w-5" />
            <span className="text-2xl font-bold">{items.length}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">待审核</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-2xl font-bold">{todayApproved}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">今日通过</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span className="text-2xl font-bold">{todayRejected}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">今日拒绝</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card admin-table-wrap overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">商品</th>
              <th className="px-4 py-3 text-left font-medium">卖家</th>
              <th className="px-4 py-3 text-left font-medium">价格</th>
              <th className="px-4 py-3 text-left font-medium">提交时间</th>
              <th className="px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">加载中...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                <Bot className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                暂无待审核商品
              </td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{item.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.seller?.nickname || '—'}</td>
                  <td className="px-4 py-3 font-medium text-primary">¥{item.price}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatRelativeTime(item.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" className="text-green-600" onClick={() => handleApprove(item.id)}>通过</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleReject(item.id)}>拒绝</Button>
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
