'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Eye, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/format'
import { toast } from 'sonner'
import type { Report } from '@/types'

interface ReportWithReporter extends Report {
  reporter?: { id: string; nickname: string; avatar_url: string | null }
}

const reasonLabels: Record<string, string> = {
  fraud: '欺诈', prohibited: '违禁品', spam: '垃圾信息', inappropriate: '不当内容', other: '其他',
}

const statusLabels: Record<string, string> = {
  pending: '待处理', reviewing: '审查中', resolved: '已处理', dismissed: '已驳回',
}

const targetTypeLabels: Record<string, string> = {
  product: '商品', user: '用户', message: '消息',
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportWithReporter[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [selectedReport, setSelectedReport] = useState<ReportWithReporter | null>(null)
  const [resolution, setResolution] = useState('')
  const [processing, setProcessing] = useState(false)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), page_size: '20' })
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/reports?${params}`)
      if (res.ok) {
        const data = await res.json()
        setReports(data.data || [])
        setHasMore(data.has_more || false)
        setTotal(data.total || 0)
      }
    } catch {} finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { fetchReports() }, [fetchReports])

  const handleAction = async (id: string, status: 'reviewing' | 'resolved' | 'dismissed') => {
    setProcessing(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, resolution: resolution || undefined }),
      })
      if (res.ok) {
        const label = status === 'resolved' ? '已处理' : status === 'dismissed' ? '已驳回' : '审查中'
        toast.success(`举报已标记为${label}`)
        setSelectedReport(null)
        setResolution('')
        fetchReports()
      } else {
        toast.error('操作失败')
      }
    } catch {
      toast.error('操作失败')
    } finally {
      setProcessing(false)
    }
  }

  const statusBadges: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: typeof Clock }> = {
    pending: { variant: 'secondary', icon: Clock },
    reviewing: { variant: 'outline', icon: Eye },
    resolved: { variant: 'default', icon: CheckCircle },
    dismissed: { variant: 'destructive', icon: XCircle },
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">举报管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">审查用户举报，处理违规内容</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'reviewing', 'resolved', 'dismissed'].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setStatusFilter(s); setPage(1) }}
            >
              {s === 'all' ? '全部' : statusLabels[s]}
            </Button>
          ))}
        </div>
        <span className="ml-auto text-sm text-muted-foreground">共 {total} 条</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>上一页</Button>
          <span className="flex items-center text-sm text-muted-foreground">第 {page} 页</span>
          <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>下一页</Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">举报人</th>
              <th className="px-4 py-3 text-left font-medium">类型</th>
              <th className="px-4 py-3 text-left font-medium">原因</th>
              <th className="px-4 py-3 text-left font-medium">描述</th>
              <th className="px-4 py-3 text-left font-medium">状态</th>
              <th className="px-4 py-3 text-left font-medium">时间</th>
              <th className="px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">加载中...</td></tr>
            ) : reports.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">暂无举报记录</td></tr>
            ) : (
              reports.map((r) => {
                const badge = statusBadges[r.status] || statusBadges.pending
                return (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{r.reporter?.nickname || r.reporter_id.slice(0, 8)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{targetTypeLabels[r.target_type] || r.target_type}</Badge>
                    </td>
                    <td className="px-4 py-3">{reasonLabels[r.reason] || r.reason}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-muted-foreground">{r.description || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={badge.variant}>{statusLabels[r.status] || r.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatRelativeTime(r.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      {r.status === 'pending' || r.status === 'reviewing' ? (
                        <Button variant="outline" size="sm" onClick={() => setSelectedReport(r)}>
                          处理
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {r.resolution || '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 处理举报弹窗 */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">处理举报</h2>
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">举报类型</span>
                <span>{targetTypeLabels[selectedReport.target_type]} ({selectedReport.target_id.slice(0, 8)}...)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">举报原因</span>
                <span>{reasonLabels[selectedReport.reason]}</span>
              </div>
              {selectedReport.description && (
                <div>
                  <span className="text-muted-foreground">详细描述</span>
                  <p className="mt-1 rounded-lg bg-muted p-3 text-sm">{selectedReport.description}</p>
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">处理备注</label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="填写处理结果（可选）"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setSelectedReport(null); setResolution('') }}
              >
                取消
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                disabled={processing}
                onClick={() => handleAction(selectedReport.id, 'dismissed')}
              >
                驳回
              </Button>
              <Button
                className="flex-1"
                disabled={processing}
                onClick={() => handleAction(selectedReport.id, 'resolved')}
              >
                处理
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
