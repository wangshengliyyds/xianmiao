'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  AlertTriangle,
  Wallet,
  Bot,
  Megaphone,
  FileText,
  Shield,
  ScrollText,
  Settings,
  Menu,
  X,
  ArrowLeft,
  Home,
  Flag,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { LoadingSpinner } from '@/components/common/loading-spinner'

const navItems = [
  { icon: LayoutDashboard, label: '数据看板', href: '/admin' },
  { icon: Users, label: '用户管理', href: '/admin/users' },
  { icon: Bot, label: '商品审核', href: '/admin/ai-review' },
  { icon: ShoppingCart, label: '订单管理', href: '/admin/orders' },
  { icon: AlertTriangle, label: '交易纠纷', href: '/admin/disputes' },
  { icon: Wallet, label: '财务中心', href: '/admin/finance' },
  { icon: Megaphone, label: '营销活动', href: '/admin/campaigns' },
  { icon: FileText, label: '内容管理', href: '/admin/content' },
  { icon: Shield, label: '风控规则', href: '/admin/risk' },
  { icon: Flag, label: '举报管理', href: '/admin/reports' },
  { icon: ScrollText, label: '审计日志', href: '/admin/audit' },
  { icon: Settings, label: '系统设置', href: '/admin/settings' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.replace('/profile')
    }
  }, [user, loading, router])

  if (loading) return <LoadingSpinner text="验证权限中..." />
  if (!user || user.role !== 'admin') return null

  return (
    <div className="flex min-h-screen">
      {/* 移动端菜单按钮 */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* 侧边栏 */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-56 border-r bg-muted/30 p-4 transition-transform md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Link href="/admin" className="mb-6 block">
          <h2 className="text-lg font-bold text-primary">闲妙管理</h2>
          <p className="text-xs text-muted-foreground">Admin Dashboard</p>
        </Link>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4 stroke-[1.8]" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>


      {/* 主内容 */}
      <div className="flex-1 overflow-auto">
        {/* 顶部导航栏 */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
          >
            <Home className="h-5 w-5 stroke-[2]" />
          </Link>
          {/* 移动端侧边栏开关 */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted md:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5 stroke-[1.8]" /> : <Menu className="h-5 w-5 stroke-[1.8]" />}
          </button>
          <span className="text-sm font-medium text-muted-foreground">管理后台</span>
          <span className="ml-auto text-xs text-muted-foreground">{user.nickname}</span>
        </header>
        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
