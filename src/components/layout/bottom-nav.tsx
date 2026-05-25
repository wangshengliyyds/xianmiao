'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, PlusCircle, MessageCircle, User, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUnread } from '@/lib/hooks/use-unread'
import { useAuth } from '@/lib/hooks/use-auth'

export function BottomNav() {
  const pathname = usePathname()
  const { data } = useUnread()
  const { user } = useAuth()
  const chatUnread = data?.chat_unread || 0
  const notifUnread = data?.notification_unread || 0

  const canPublish = user?.role === 'seller' || user?.role === 'merchant' || user?.role === 'admin'

  const navItems = [
    { href: '/', icon: Home, label: '首页' },
    { href: '/search', icon: Search, label: '搜索' },
    ...(canPublish
      ? [{ href: '/product/publish', icon: PlusCircle, label: '发布' }]
      : [{ href: '/order', icon: Package, label: '订单' }]),
    { href: '/chat', icon: MessageCircle, label: '消息', badge: chatUnread },
    { href: '/profile', icon: User, label: '我的', dot: notifUnread > 0 },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background safe-bottom md:hidden">
      <div className="flex h-14 items-center justify-around max-w-2xl mx-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)
          const isPublish = item.href === '/product/publish'

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-1 text-xs transition-colors',
                isPublish && 'relative -top-3',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isPublish ? (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                  <item.icon className="h-6 w-6" />
                </div>
              ) : (
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.badge != null && item.badge > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white leading-[18px]">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                  {item.dot && (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </div>
              )}
              {!isPublish && <span>{item.label}</span>}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
