'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, Package, MessageCircle, Gift, Shield, Info } from 'lucide-react'
import { formatRelativeTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { useNotifications, useMarkNotificationsRead } from '@/lib/hooks/use-notifications'
import { toast } from 'sonner'
import type { Notification } from '@/types'

const typeIcons: Record<string, typeof Bell> = {
  order: Package,
  chat: MessageCircle,
  promotion: Gift,
  security: Shield,
  system: Info,
}

const typeColors: Record<string, string> = {
  order: 'text-blue-500 bg-blue-50',
  chat: 'text-green-500 bg-green-50',
  promotion: 'text-orange-500 bg-orange-50',
  security: 'text-red-500 bg-red-50',
  system: 'text-gray-500 bg-gray-50',
}

export default function NotificationPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [allNotifications, setAllNotifications] = useState<Notification[]>([])

  const { data, isLoading } = useNotifications(undefined, page, 20)
  const markRead = useMarkNotificationsRead()

  useEffect(() => {
    if (data?.data) {
      setAllNotifications((prev) => {
        if (page === 1) return data.data
        const existingIds = new Set(prev.map((n) => n.id))
        const newItems = data.data.filter((n) => !existingIds.has(n.id))
        return [...prev, ...newItems]
      })
    }
  }, [data, page])

  const handleMarkAllRead = async () => {
    try {
      await markRead.mutateAsync({ markAll: true })
      setAllNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      toast.success('已全部标记为已读')
    } catch {
      toast.error('操作失败')
    }
  }

  const handleMarkRead = async (id: string) => {
    // 乐观更新本地状态
    setAllNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
    try {
      await markRead.mutateAsync({ ids: [id] })
    } catch {
      // 回滚
      setAllNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: false } : n))
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkRead(notification.id)
    }
    // 根据通知类型跳转
    const link = notification.link
    if (link) {
      router.push(link)
    } else if (notification.type === 'chat') {
      router.push('/chat')
    } else if (notification.type === 'order') {
      router.push('/order')
    }
  }

  const notifications = allNotifications
  const unreadCount = allNotifications.filter((n) => !n.is_read).length

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">通知</h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markRead.isPending}
          >
            <Check className="mr-1 h-4 w-4 stroke-[2]" />
            全部已读
          </Button>
        )}
      </div>

      {isLoading && page === 1 ? (
        <LoadingSpinner text="加载中..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-8 w-8 stroke-[1.5] text-muted-foreground/40" />}
          title="暂无通知"
          description="有新消息时会在这里提醒你"
        />
      ) : (
        <div className="divide-y">
          {notifications.map((notification) => {
            const Icon = typeIcons[notification.type] || Bell
            const colorClass = typeColors[notification.type] || typeColors.system

            return (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`flex cursor-pointer gap-3 px-4 py-3.5 transition-colors ${
                  !notification.is_read ? 'bg-primary/5' : ''
                } hover:bg-muted/50`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                  <Icon className="h-5 w-5 stroke-[2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-sm ${!notification.is_read ? 'font-semibold' : ''}`}>
                      {notification.title}
                    </h3>
                    {!notification.is_read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  {notification.content && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                      {notification.content}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatRelativeTime(notification.created_at)}
                  </p>
                </div>
              </div>
            )
          })}

          {data?.has_more && (
            <div className="py-4 text-center">
              <Button
                variant="ghost"
                onClick={() => setPage((p) => p + 1)}
              >
                加载更多
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
