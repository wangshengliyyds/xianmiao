'use client'

import Link from 'next/link'
import { useAuthStore } from '@/stores/auth-store'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { MOCK_FAVORITE_IDS } from '@/lib/mock-data'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronRight,
  Package,
  Heart,
  MapPin,
  Settings,
  Shield,
  LogOut,
  CreditCard,
  Star,
  Store,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function ProfilePage() {
  const { user, profile, logout, isLoading } = useAuthStore()
  const router = useRouter()
  const [favCount, setFavCount] = useState(0)

  useEffect(() => {
    if (!user) return
    if (!isSupabaseConfigured()) {
      setFavCount(MOCK_FAVORITE_IDS.length)
      return
    }
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient()
      supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .then(({ count }) => setFavCount(count || 0))
    })
  }, [user])

  const handleLogout = async () => {
    await logout()
    toast.success('已退出登录')
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="h-20 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center">
        <p className="mb-4 text-muted-foreground">登录后查看个人主页</p>
        <Link href="/login?redirect=/profile">
          <Button>去登录</Button>
        </Link>
      </div>
    )
  }

  const menuItems = [
    { icon: Package, label: '我的订单', href: '/order', desc: '查看全部订单' },
    { icon: Heart, label: '我的收藏', href: '/profile/favorites', desc: `${favCount} 件宝贝` },
    { icon: CreditCard, label: '地址管理', href: '/profile/addresses', desc: '收货地址' },
    { icon: Store, label: '商家中心', href: '/merchant/apply', desc: profile?.role === 'merchant' ? '管理店铺' : '开通商家' },
    { icon: Star, label: '我的信用', href: '#', desc: `${profile?.credit_score || 100} 分` },
    { icon: Shield, label: '实名认证', href: '#', desc: profile?.is_verified ? '已认证' : '未认证' },
    { icon: Settings, label: '设置', href: '#', desc: '账号与安全' },
  ]

  return (
    <div className="mx-auto max-w-2xl">
      {/* 用户信息卡片 */}
      <div className="bg-gradient-to-br from-primary to-emerald-600 p-6 text-primary-foreground">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-white/30">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-white/20 text-xl">
              {profile?.nickname?.[0] || '用'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{profile?.nickname}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary" className="bg-white/20 text-primary-foreground border-0">
                {profile?.role === 'merchant' ? '商家' : profile?.role === 'seller' ? '卖家' : '买家'}
              </Badge>
              {profile?.is_verified && (
                <Badge variant="secondary" className="bg-white/20 text-primary-foreground border-0">
                  已认证
                </Badge>
              )}
            </div>
          </div>
          <Link href="/profile/edit">
            <Button variant="secondary" size="sm" className="bg-white/20 text-primary-foreground border-0 hover:bg-white/30">
              编辑资料
            </Button>
          </Link>
        </div>
      </div>

      {/* 菜单列表 */}
      <div className="px-4 py-2">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 rounded-xl px-3 py-4 transition-colors hover:bg-muted"
          >
            <item.icon className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <span className="text-sm font-medium">{item.label}</span>
              <span className="ml-2 text-xs text-muted-foreground">{item.desc}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-4 text-red-500 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">退出登录</span>
        </button>
      </div>
    </div>
  )
}
