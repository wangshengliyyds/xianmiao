'use client'

import { useEffect, useState } from 'react'
import { Search, Ban, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/format'
import { toast } from 'sonner'
import type { Profile } from '@/types'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), page_size: '20' })
    if (search) params.set('search', search)
    fetch(`/api/admin/users?${params}`)
      .then((res) => res.ok ? res.json() : { data: [] })
      .then((res) => {
        setUsers(res.data || [])
        setHasMore(res.has_more || false)
        setTotal(res.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, search])

  const toggleBan = async (userId: string, banned: boolean) => {
    const action = banned ? '解封' : '封禁'
    if (!window.confirm(`确定要${action}该用户吗？`)) return
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_banned: !banned }),
      })
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_banned: !banned } : u))
        toast.success(banned ? '已解封' : '已封禁')
      }
    } catch {
      toast.error('操作失败')
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">用户管理</h1>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="搜索用户..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
        </div>
        <span className="text-sm text-muted-foreground">共 {total} 用户</span>
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
              <th className="px-4 py-3 text-left font-medium">用户</th>
              <th className="px-4 py-3 text-left font-medium">角色</th>
              <th className="px-4 py-3 text-left font-medium">信用分</th>
              <th className="px-4 py-3 text-left font-medium">注册时间</th>
              <th className="px-4 py-3 text-left font-medium">状态</th>
              <th className="px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">加载中...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">暂无数据</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{user.nickname}</p>
                    <p className="text-xs text-muted-foreground">{user.phone || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? '管理员' : user.role === 'merchant' || user.role === 'seller' ? '商家' : '用户'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{user.credit_score}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatRelativeTime(user.created_at)}</td>
                  <td className="px-4 py-3">
                    {user.is_banned ? (
                      <Badge variant="destructive">已封禁</Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600">正常</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleBan(user.id, user.is_banned)}
                      className={user.is_banned ? 'text-green-600' : 'text-destructive'}
                    >
                      {user.is_banned ? <CheckCircle className="mr-1 h-4 w-4" /> : <Ban className="mr-1 h-4 w-4" />}
                      {user.is_banned ? '解封' : '封禁'}
                    </Button>
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
