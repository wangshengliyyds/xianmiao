'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useNotifications, useMarkNotificationRead } from '@/lib/hooks/use-chat'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Bell, Package, MessageCircle, Shield, Gift,
  CheckCheck, ChevronLeft,
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  order: Package,
  chat: MessageCircle,
  system: Bell,
  promotion: Gift,
  security: Shield,
}

export default function NotificationPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: notifications, isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()

  const handleMarkAllRead = () => {
    markRead.mutate(undefined, {
      onSuccess: () => toast.success('已全部标记为已读'),
    })
  }

  const handleMarkOneRead = (id: string) => {
    markRead.mutate(id)
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0

  return (
    <div className="mx-auto max-w-2xl">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b bg-background px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="p-1">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">通知</h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="mr-1 h-4 w-4" />
            全部已读
          </Button>
        )}
      </div>

      {/* 通知列表 */}
      <div>
        {isLoading ? (
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <Skeleton className="mt-1 h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="divide-y">
            {notifications.map((notif) => {
              const Icon = NOTIFICATION_ICONS[notif.type] || Bell
              const link = notif.data?.order_id
                ? `/order/${notif.data.order_id}`
                : notif.data?.conversation_id
                ? `/chat/${notif.data.conversation_id}`
                : undefined

              const content = (
                <div
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 transition-colors',
                    !notif.is_read && 'bg-primary/5',
                    link && 'hover:bg-muted/50 cursor-pointer'
                  )}
                  onClick={() => {
                    if (!notif.is_read) handleMarkOneRead(notif.id)
                  }}
                >
                  <div className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    notif.type === 'order' ? 'bg-blue-100 text-blue-600' :
                    notif.type === 'chat' ? 'bg-green-100 text-green-600' :
                    notif.type === 'security' ? 'bg-red-100 text-red-600' :
                    notif.type === 'promotion' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-muted text-muted-foreground'
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn('text-sm', !notif.is_read && 'font-semibold')}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    {notif.body && (
                      <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                        {notif.body}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatRelativeTime(notif.created_at)}
                    </p>
                  </div>
                </div>
              )

              return link ? (
                <Link key={notif.id} href={link}>{content}</Link>
              ) : (
                <div key={notif.id}>{content}</div>
              )
            })}
          </div>
        ) : (
          <div className="py-20 text-center">
            <Bell className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">暂无通知</p>
          </div>
        )}
      </div>
    </div>
  )
}
