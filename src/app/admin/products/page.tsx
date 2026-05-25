'use client'

import { useEffect, useState } from 'react'
import { Search, Eye } from 'lucide-react'
import { SmartImage } from '@/components/ui/smart-image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatRelativeTime } from '@/lib/format'
import type { ProductWithImages } from '@/types'

const statusLabels: Record<string, string> = {
  draft: '待审核', active: '已上架', reserved: '已预订', sold: '已售出', expired: '已过期', removed: '已下架',
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductWithImages[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), page_size: '20' })
    if (search) params.set('search', search)
    fetch(`/api/admin/products?${params}`)
      .then((res) => res.ok ? res.json() : { data: [] })
      .then((res) => {
        setProducts(res.data || [])
        setHasMore(res.has_more || false)
        setTotal(res.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, search])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">商品审核</h1>
        <p className="mt-1 text-sm text-muted-foreground">查看全平台商品数据，审核由 AI 自动处理</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="搜索商品..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
        </div>
        <span className="text-sm text-muted-foreground">共 {total} 件</span>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>上一页</Button>
          <span className="flex items-center text-sm text-muted-foreground">第 {page} 页</span>
          <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>下一页</Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">商品</th>
              <th className="px-4 py-3 text-left font-medium">价格</th>
              <th className="px-4 py-3 text-left font-medium">状态</th>
              <th className="px-4 py-3 text-left font-medium">浏览</th>
              <th className="px-4 py-3 text-left font-medium">发布</th>
              <th className="px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">加载中...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">暂无数据</td></tr>
            ) : (
              products.map((product) => {
                const cover = product.images?.find((i) => i.is_cover)?.url || product.images?.[0]?.url
                return (
                  <tr key={product.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {cover && <SmartImage src={cover} alt="" fill className="object-cover" sizes="40px" />}
                        </div>
                        <span className="line-clamp-1 font-medium">{product.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-primary">{formatPrice(product.price)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={product.status === 'active' ? 'outline' : 'secondary'}>
                        {statusLabels[product.status] || product.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{product.view_count}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatRelativeTime(product.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <a href={`/product/${product.id}`} target="_blank" className="inline-flex items-center justify-center rounded-lg p-2 text-sm font-medium transition-colors hover:bg-muted"><Eye className="h-4 w-4" /></a>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
