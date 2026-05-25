'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ChevronRight,
  Tag,
  ShoppingBag,
  Heart,
  MapPin,
  Star,
  Store,
  Settings,
  HelpCircle,
  Shield,
  LogOut,
  User,
  Wallet,
  Package,
  Truck,
  CircleCheck,
  Bug,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BackHeader } from '@/components/common/back-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { useAuth } from '@/lib/hooks/use-auth'
import { activateDevTools } from '@/components/dev/dev-tools'
import { formatRelativeTime } from '@/lib/format'
import { toast } from 'sonner'

const menuItemsConfig = [
  { icon: MapPin, label: '收货地址', href: '/profile/address' },
  { icon: Star, label: '我的评价', href: '/profile/ratings' },
]

const sellerMenuItems = [
  { icon: Tag, label: '我发布的', href: '/profile/products', countKey: 'products' as const },
  { icon: ShoppingBag, label: '我卖出的', href: '/profile/sold', countKey: 'sold' as const },
  { icon: Wallet, label: '我的账单', href: '/profile/finance' },
]

const buyerMenuItems = [
  { icon: Heart, label: '我的收藏', href: '/profile/favorites', countKey: 'favorites' as const },
]

const orderStatusItems = [
  { label: '待付款', status: 'pending_pay', icon: Wallet },
  { label: '待发货', status: 'paid', icon: Package },
  { label: '待收货', status: 'shipped', icon: Truck },
  { label: '已完成', status: 'completed', icon: CircleCheck },
]

const settingsItems = [
  { icon: Settings, label: '设置', href: '/profile/settings' },
  { icon: HelpCircle, label: '帮助与反馈', href: '/profile/help' },
]

const adminItem = { icon: Shield, label: '管理后台', href: '/admin' }

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const [counts, setCounts] = useState({ products: 0, sold: 0, favorites: 0 })

  const isBuyer = user?.role === 'buyer'
  const isSeller = user?.role === 'seller' || user?.role === 'merchant'
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (!user) return
    Promise.all([
      fetch(`/api/products?seller_id=${user.id}&page=1&page_size=1`).then((r) => r.ok ? r.json() : { total: 0 }).catch(() => ({ total: 0 })),
      fetch('/api/orders?role=seller&status=completed&page=1&page_size=1').then((r) => r.ok ? r.json() : { total: 0 }).catch(() => ({ total: 0 })),
      fetch('/api/favorites?page=1&page_size=1').then((r) => r.ok ? r.json() : { total: 0 }).catch(() => ({ total: 0 })),
    ]).then(([products, orders, favorites]) => {
      setCounts({
        products: products.total || 0,
        sold: orders.total || 0,
        favorites: favorites.total || 0,
      })
    })
  }, [user])

  const handleLogout = async () => {
    await logout()
    toast.success('已退出登录')
    router.push('/login')
  }

  if (loading) {
    return <LoadingSpinner text="加载中..." />
  }

  if (!user) {
    return (
      <div>
        <BackHeader title="我的" />
        <div className="mx-auto max-w-2xl px-4 py-12 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 mx-auto">
            <User className="h-8 w-8 text-muted-foreground/50 stroke-[1.5]" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">登录闲妙</h2>
          <p className="mb-6 text-sm text-muted-foreground">登录后即可发布商品、管理订单</p>
          <Button onClick={() => router.push('/login')} size="lg">
            立即登录
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <BackHeader title="我的" />
      <div className="mx-auto max-w-2xl px-4 py-6">
      {/* ===== 用户信息区 ===== */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-2xl bg-muted">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={user.nickname}
              fill
              className="object-cover"
              sizes="60px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="h-7 w-7 text-muted-foreground/40 stroke-[1.5]" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold tracking-tight">{user.nickname}</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            信用分 {user.credit_score} · {formatRelativeTime(user.created_at)}加入
          </p>
        </div>
        <Link href="/profile/edit">
          <Button variant="outline" size="sm" className="rounded-full text-xs">
            编辑资料
          </Button>
        </Link>
      </div>

      {/* ===== 功能菜单区 ===== */}
      <div className="mb-4 rounded-2xl border bg-card">
        {isSeller && sellerMenuItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 first:rounded-t-2xl last:rounded-b-2xl"
            >
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-muted/60">
                <Icon className="h-[18px] w-[18px] stroke-[1.8] text-foreground/65" />
              </div>
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              {item.countKey && counts[item.countKey] > 0 && (
                <span className="text-xs text-muted-foreground">{counts[item.countKey]}</span>
              )}
              <ChevronRight className="h-4 w-4 stroke-[2] text-muted-foreground/40" />
            </Link>
          )
        })}
        {!isAdmin && menuItemsConfig.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 first:rounded-t-2xl last:rounded-b-2xl"
            >
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-muted/60">
                <Icon className="h-[18px] w-[18px] stroke-[1.8] text-foreground/65" />
              </div>
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              <ChevronRight className="h-4 w-4 stroke-[2] text-muted-foreground/40" />
            </Link>
          )
        })}
        {(isBuyer || isSeller) && buyerMenuItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 first:rounded-t-2xl last:rounded-b-2xl"
            >
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-muted/60">
                <Icon className="h-[18px] w-[18px] stroke-[1.8] text-foreground/65" />
              </div>
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              {item.countKey && counts[item.countKey] > 0 && (
                <span className="text-xs text-muted-foreground">{counts[item.countKey]}</span>
              )}
              <ChevronRight className="h-4 w-4 stroke-[2] text-muted-foreground/40" />
            </Link>
          )
        })}
      </div>

      {/* ===== 我的订单区 ===== */}
      {(isBuyer || isSeller) && (
      <div className="mb-4 rounded-2xl border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-tight">我的订单</h3>
          <Link
            href="/order"
            className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            全部订单
            <ChevronRight className="h-3.5 w-3.5 stroke-[2]" />
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {orderStatusItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.status}
                href={`/order?status=${item.status}`}
                className="flex flex-col items-center gap-2 rounded-xl py-2 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center">
                  <Icon className="h-[22px] w-[22px] stroke-[1.8] text-foreground/60" />
                </div>
                <span className="text-xs font-medium text-foreground/75">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
      )}

      {/* ===== 设置区 ===== */}
      <div className="mb-4 rounded-2xl border bg-card">
        {isSeller && (
          <Link
            href="/merchant"
            className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 rounded-t-2xl"
          >
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-muted/60">
              <Store className="h-[18px] w-[18px] stroke-[1.8] text-foreground/65" />
            </div>
            <span className="flex-1 text-sm font-medium">商家中心</span>
            <ChevronRight className="h-4 w-4 stroke-[2] text-muted-foreground/40" />
          </Link>
        )}
        {user.role === 'admin' && (
          <Link
            href={adminItem.href}
            className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 rounded-t-2xl"
          >
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-[18px] w-[18px] stroke-[1.8] text-primary" />
            </div>
            <span className="flex-1 text-sm font-medium">{adminItem.label}</span>
            <ChevronRight className="h-4 w-4 stroke-[2] text-muted-foreground/40" />
          </Link>
        )}
        {settingsItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 first:rounded-t-2xl last:rounded-b-2xl"
            >
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-muted/60">
                <Icon className="h-[18px] w-[18px] stroke-[1.8] text-foreground/65" />
              </div>
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              <ChevronRight className="h-4 w-4 stroke-[2] text-muted-foreground/40" />
            </Link>
          )
        })}
      </div>

      {/* ===== 退出登录 ===== */}
      <Button
        variant="ghost"
        onClick={handleLogout}
        className="w-full gap-2 rounded-2xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5"
      >
        <LogOut className="h-[18px] w-[18px] stroke-[1.8]" />
        退出登录
      </Button>

      {/* ===== 开发者工具入口 ===== */}
      <button
        onClick={activateDevTools}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl py-2 text-[10px] text-muted-foreground/30 transition-colors hover:text-muted-foreground/60"
      >
        <Bug className="h-3 w-3" />
        <span>开发者工具</span>
      </button>
      </div>
    </div>
  )
}
