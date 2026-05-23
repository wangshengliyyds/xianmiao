'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, ShoppingBag, Package,
  AlertTriangle, DollarSign, Bot, Megaphone,
  FileText, Shield, ScrollText, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: '数据看板' },
  { href: '/admin/users', icon: Users, label: '用户管理' },
  { href: '/admin/products', icon: ShoppingBag, label: '商品管理' },
  { href: '/admin/orders', icon: Package, label: '订单管理' },
  { href: '/admin/disputes', icon: AlertTriangle, label: '交易纠纷' },
  { href: '/admin/merchants', icon: DollarSign, label: '商家审核' },
  { href: '/admin/ai-review', icon: Bot, label: 'AI审核' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      {/* 侧边栏 */}
      <aside className="hidden w-56 border-r bg-muted/30 md:block">
        <div className="p-4">
          <Link href="/" className="text-lg font-bold text-primary">闲妙管理</Link>
        </div>
        <nav className="space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* 主内容 */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
