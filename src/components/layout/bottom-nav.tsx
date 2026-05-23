'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, PlusCircle, MessageCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConversations } from '@/lib/hooks/use-chat'

const navItems = [
  { href: '/', icon: Home, label: '首页' },
  { href: '/search', icon: Search, label: '搜索' },
  { href: '/product/publish', icon: PlusCircle, label: '发布' },
  { href: '/chat', icon: MessageCircle, label: '消息' },
  { href: '/profile', icon: User, label: '我的' },
]

export function BottomNav() {
  const pathname = usePathname()
  const { data: conversations } = useConversations()

  const totalUnread = conversations?.reduce((sum, c) => sum + (c.unread_count || 0), 0) || 0

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
                'flex flex-col items-center justify-center gap-1 px-3 py-1 text-xs transition-colors relative',
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
                <>
                  <item.icon className="h-5 w-5" />
                  {item.href === '/chat' && totalUnread > 0 && (
                    <span className="absolute -top-0.5 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </>
              )}
              {!isPublish && <span>{item.label}</span>}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
