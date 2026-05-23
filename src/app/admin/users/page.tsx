'use client'

import { useState } from 'react'
import { useAdminUsers, useAdminUpdateUser } from '@/lib/hooks/use-admin'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Search, Check, Shield } from 'lucide-react'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const { data: users, isLoading } = useAdminUsers(search || undefined)
  const updateUser = useAdminUpdateUser()

  const handleToggleVerify = (userId: string, currentValue: boolean) => {
    updateUser.mutate(
      { userId, is_verified: !currentValue },
      { onSuccess: () => toast.success('已更新') }
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">用户管理</h1>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索用户昵称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium">昵称</th>
                <th className="px-4 py-3 font-medium">角色</th>
                <th className="px-4 py-3 font-medium">信用分</th>
                <th className="px-4 py-3 font-medium">认证</th>
                <th className="px-4 py-3 font-medium">注册时间</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users?.map((user: any) => (
                <tr key={user.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{user.nickname || '未设置'}</p>
                      <p className="text-xs text-muted-foreground">{user.phone || '-'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs">
                      {user.role === 'admin' ? '管理员' : user.role === 'merchant' ? '商家' : user.role === 'seller' ? '卖家' : '买家'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{user.credit_score || 100}</td>
                  <td className="px-4 py-3">
                    {user.is_verified ? (
                      <Badge className="bg-green-100 text-xs text-green-700">已认证</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">未认证</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleVerify(user.id, user.is_verified)}
                    >
                      <Shield className="mr-1 h-3 w-3" />
                      {user.is_verified ? '取消认证' : '认证'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!users || users.length === 0) && (
            <div className="py-10 text-center text-sm text-muted-foreground">暂无用户</div>
          )}
        </div>
      )}
    </div>
  )
}
