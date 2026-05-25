'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, Package, ShoppingCart, TrendingUp, AlertTriangle, Eye } from 'lucide-react'

interface Stats {
  totalUsers: number
  totalProducts: number
  totalOrders: number
  activeProducts: number
  pendingOrders: number
  todayOrders: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    activeProducts: 0,
    pendingOrders: 0,
    todayOrders: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 并行获取统计数据
        const [usersRes, productsRes, ordersRes] = await Promise.all([
          fetch('/api/admin/stats?type=users').catch(() => null),
          fetch('/api/admin/stats?type=products').catch(() => null),
          fetch('/api/admin/stats?type=orders').catch(() => null),
        ])

        const users = usersRes?.ok ? await usersRes.json() : {}
        const products = productsRes?.ok ? await productsRes.json() : {}
        const orders = ordersRes?.ok ? await ordersRes.json() : {}

        setStats({
          totalUsers: users.total || 0,
          totalProducts: products.total || 0,
          totalOrders: orders.total || 0,
          activeProducts: products.active || 0,
          pendingOrders: orders.pending || 0,
          todayOrders: orders.today || 0,
        })
      } catch {
        // 使用默认值
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    { label: '总用户数', value: stats.totalUsers, icon: Users, color: 'text-blue-500 bg-blue-50', href: '/admin/users' },
    { label: '总商品数', value: stats.totalProducts, icon: Package, color: 'text-green-500 bg-green-50', href: '/admin/products' },
    { label: '总订单数', value: stats.totalOrders, icon: ShoppingCart, color: 'text-purple-500 bg-purple-50', href: '/admin/orders' },
    { label: '在售商品', value: stats.activeProducts, icon: Eye, color: 'text-orange-500 bg-orange-50', href: '/admin/products' },
    { label: '待处理订单', value: stats.pendingOrders, icon: AlertTriangle, color: 'text-red-500 bg-red-50', href: '/admin/orders' },
    { label: '今日订单', value: stats.todayOrders, icon: TrendingUp, color: 'text-cyan-500 bg-cyan-50', href: '/admin/orders' },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">数据看板</h1>

      {/* 统计卡片 */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}>
                  <Icon className="h-5 w-5 stroke-[1.8]" />
                </div>
              </div>
              <p className="text-2xl font-bold">
                {loading ? '—' : card.value.toLocaleString()}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">{card.label}</p>
            </Link>
          )
        })}
      </div>

      {/* 快捷操作 */}
      <h2 className="mb-4 text-lg font-semibold">快捷操作</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: '用户管理', desc: '查看和管理用户', href: '/admin/users' },
          { label: '商品审核', desc: '审核新发布商品', href: '/admin/products' },
          { label: '订单处理', desc: '处理待处理订单', href: '/admin/orders' },
          { label: '纠纷处理', desc: '处理交易纠纷', href: '/admin/disputes' },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
          >
            <p className="font-medium">{item.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
