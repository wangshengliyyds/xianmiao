'use client'

import Link from 'next/link'
import { Search, Bell, User } from 'lucide-react'
import { useUnread } from '@/lib/hooks/use-unread'
import { triggerDevTools } from '@/components/dev/dev-tools'

export function Header() {
  const { data } = useUnread()
  const notifUnread = data?.notification_unread || 0

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-top">
      <div className="flex h-14 items-center px-4 max-w-2xl mx-auto">
        <Link href="/" className="flex items-center gap-2 mr-4">
          <span className="text-xl font-bold text-primary">闲妙</span>
        </Link>
        {/* 开发者工具隐形触发区：连续点击此处5次 */}
        <span className="h-8 w-2 cursor-default select-none" onPointerDown={triggerDevTools} />

        <Link href="/search" className="flex-1">
          <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4 stroke-[2]" />
            <span>搜索你想找的宝贝</span>
          </div>
        </Link>

        <Link href="/notification" className="relative ml-2 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted">
          <Bell className="h-[20px] w-[20px] stroke-[2] text-foreground/75" />
          {notifUnread > 0 && (
            <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Link>

        <Link href="/profile" className="ml-1 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted">
          <User className="h-[20px] w-[20px] stroke-[2] text-foreground/75" />
        </Link>
      </div>
    </header>
  )
}
