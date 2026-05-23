'use client'

import Link from 'next/link'
import { Search, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores/auth-store'
import { useUnreadNotificationCount } from '@/lib/hooks/use-chat'

export function Header() {
  const { user, profile, isLoading } = useAuthStore()
  const { data: unreadCount } = useUnreadNotificationCount()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-top">
      <div className="flex h-14 items-center px-4 max-w-2xl mx-auto">
        <Link href="/" className="flex items-center gap-2 mr-4">
          <span className="text-xl font-bold text-primary">闲妙</span>
        </Link>

        <Link href="/search" className="flex-1">
          <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            <span>搜索你想找的宝贝</span>
          </div>
        </Link>

        {user && (
          <Link href="/notification">
            <Button variant="ghost" size="icon" className="ml-2 relative">
              <Bell className="h-5 w-5" />
              {(unreadCount ?? 0) > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                  {(unreadCount ?? 0) > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </Link>
        )}

        {!isLoading && (
          user ? (
            <Link href="/profile">
              <Avatar className="ml-2 h-8 w-8">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {profile?.nickname?.[0] || '用'}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm" className="ml-2">
                登录
              </Button>
            </Link>
          )
        )}
      </div>
    </header>
  )
}
