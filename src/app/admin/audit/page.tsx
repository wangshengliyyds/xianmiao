'use client'

import { useEffect, useState } from 'react'
import { ScrollText, ShoppingCart, Package, User, LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/format'

interface AuditLog {
  id: string
  icon: LucideIcon
  action: string
  target: string
  detail: string
  created_at: string
}

const targetTypeIcon: Record<string, LucideIcon> = {
  order: ShoppingCart,
  product: Package,
  user: User,
}

const actionLabels: Record<string, string> = {
  cancel_order: '取消订单',
  refund_order: '退款订单',
  ban_user: '封禁用户',
  unban_user: '解封用户',
  remove_product: '下架商品',
}

const targetTypeLabels: Record<string, string> = {
  order: '订单',
  product: '商品',
  user: '用户',
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/admin/audit?page=1&page_size=30')
        if (!res.ok) return
        const { data } = await res.json()
        const entries: AuditLog[] = (data || []).map((item: {
          id: string
          action: string
          target_type: string
          target_id: string
          detail: string
          created_at: string
        }) => ({
          id: item.id,
          icon: targetTypeIcon[item.target_type] || ScrollText,
          action: actionLabels[item.action] || item.action,
          target: targetTypeLabels[item.target_type] || item.target_type,
          detail: item.detail,
          created_at: item.created_at,
        }))
        setLogs(entries)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">审计日志</h1>

      <div className="rounded-2xl border bg-card admin-table-wrap overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">类型</th>
              <th className="px-4 py-3 text-left font-medium">操作</th>
              <th className="px-4 py-3 text-left font-medium">对象</th>
              <th className="px-4 py-3 text-left font-medium">详情</th>
              <th className="px-4 py-3 text-left font-medium">时间</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">加载中...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                <ScrollText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                暂无审计日志
              </td></tr>
            ) : (
              logs.map((log) => {
                const Icon = log.icon
                return (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{log.action}</Badge>
                    </td>
                    <td className="px-4 py-3">{log.target}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.detail}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatRelativeTime(log.created_at)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
