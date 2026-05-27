'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { formatRelativeTime } from '@/lib/format'
import { CheckCircle, XCircle, Store } from 'lucide-react'

interface MerchantItem {
  id: string
  user_id: string
  shop_name: string
  status: string
  created_at: string
  user?: { id: string; nickname: string; avatar_url: string | null; phone: string | null; credit_score: number }
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: '待审核', variant: 'secondary' },
  approved: { label: '已通过', variant: 'default' },
  rejected: { label: '已拒绝', variant: 'destructive' },
  suspended: { label: '已暂停', variant: 'outline' },
}

export default function AdminMerchantsPage() {
  const [items, setItems] = useState<MerchantItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchItems = () => {
    setLoading(true)
    const params = new URLSearchParams({ status: statusFilter, page: String(page), page_size: '20' })
    fetch(`/api/admin/merchants?${params}`)
      .then((res) => res.ok ? res.json() : { data: [], total: 0 })
      .then((res) => {
        setItems(res.data || [])
        setTotal(res.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchItems() }, [statusFilter, page])

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/admin/merchants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        toast.success(status === 'approved' ? '已通过' : '已拒绝')
        fetchItems()
      } else {
        const err = await res.json()
        toast.error(err.error || '操作失败')
      }
    } catch {
      toast.error('操作失败')
    }
  }

  const tabs = [
    { key: 'pending', label: '待审核' },
    { key: 'approved', label: '已通过' },
    { key: 'rejected', label: '已拒绝' },
    { key: 'all', label: '全部' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">商家管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">审核商家入驻申请，管理商家状态</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={statusFilter === tab.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setStatusFilter(tab.key); setPage(1) }}
          >
            {tab.label}
          </Button>
        ))}
        <span className="ml-auto self-center text-sm text-muted-foreground">共 {total} 条</span>
      </div>

      <div className="rounded-2xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">申请人</th>
              <th className="px-4 py-3 text-left font-medium">店铺名称</th>
              <th className="px-4 py-3 text-left font-medium">信用分</th>
              <th className="px-4 py-3 text-left font-medium">状态</th>
              <th className="px-4 py-3 text-left font-medium">申请时间</th>
              <th className="px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">加载中...</td></tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  <Store className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                  暂无{statusFilter === 'pending' ? '待审核' : ''}申请
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{item.user?.nickname || '—'}</td>
                  <td className="px-4 py-3">{item.shop_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.user?.credit_score ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusLabels[item.status]?.variant || 'secondary'}>
                      {statusLabels[item.status]?.label || item.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatRelativeTime(item.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    {item.status === 'pending' ? (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" className="text-green-600" onClick={() => handleAction(item.id, 'approved')}>
                          <CheckCircle className="mr-1 h-3.5 w-3.5" />通过
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleAction(item.id, 'rejected')}>
                          <XCircle className="mr-1 h-3.5 w-3.5" />拒绝
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>上一页</Button>
          <span className="flex items-center text-sm text-muted-foreground">第 {page} 页</span>
          <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)}>下一页</Button>
        </div>
      )}
    </div>
  )
}
